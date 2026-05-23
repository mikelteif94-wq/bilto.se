import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  User,
  Building2,
  Check,
  Hash,
  Calendar,
  MapPin,
  Receipt,
  Plus,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import PortalLayout from '../components/PortalLayout';

interface AdminDealerDetailProps {
  dealerId: string;
  onBack: () => void;
  onLoggedOut: () => void;
}

type Dealer = Database['public']['Tables']['dealers']['Row'];

interface DealerInvoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  belopp: number;
  vat_kr: number;
  total_kr: number;
  commission_type: string;
  status: string;
  description: string;
  car_id: string | null;
  created_at: string;
  car?: { marke: string; modell: string; ar: number | null; regnummer: string } | null;
}

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Väntar',     cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  invoiced:  { label: 'Fakturerad', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  paid:      { label: 'Betald',     cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  overdue:   { label: 'Förfallen',  cls: 'bg-red-50 text-red-700 ring-red-200' },
  cancelled: { label: 'Avbruten',   cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
};

const STATUS_TRANSITIONS: Record<string, { next: string; label: string; cls: string }[]> = {
  pending:  [{ next: 'invoiced', label: 'Markera fakturerad', cls: 'bg-blue-600 hover:bg-blue-700 text-white' }, { next: 'overdue', label: 'Markera förfallen', cls: 'bg-red-600 hover:bg-red-700 text-white' }, { next: 'cancelled', label: 'Avbryt', cls: 'bg-slate-200 hover:bg-slate-300 text-slate-700' }],
  invoiced: [{ next: 'paid', label: 'Markera betald', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' }, { next: 'overdue', label: 'Markera förfallen', cls: 'bg-red-600 hover:bg-red-700 text-white' }],
  overdue:  [{ next: 'paid', label: 'Markera betald', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' }, { next: 'invoiced', label: 'Återställ till fakturerad', cls: 'bg-blue-600 hover:bg-blue-700 text-white' }],
  paid:     [],
  cancelled: [],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE');
}

export default function AdminDealerDetail({
  dealerId,
  onBack,
  onLoggedOut,
}: AdminDealerDetailProps) {
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvedJustNow, setApprovedJustNow] = useState(false);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<DealerInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [addForm, setAddForm] = useState({
    commission_type: 'standard',
    description: '',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dealers')
        .select('*')
        .eq('id', dealerId)
        .maybeSingle();
      if (fetchError || !data) {
        setError('Kunde inte hämta handlaren.');
      } else {
        setDealer(data as Dealer);
      }
      setLoading(false);
    })();
    void loadInvoices();
  }, [dealerId]);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    const { data } = await supabase
      .from('dealer_invoices')
      .select('id, invoice_number, invoice_date, due_date, belopp, vat_kr, total_kr, commission_type, status, description, car_id, created_at, cars:car_id(marke, modell, ar, regnummer)')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false });

    const rows: DealerInvoice[] = (data ?? []).map((r: any) => ({
      ...r,
      car: Array.isArray(r.cars) ? r.cars[0] : r.cars,
    }));
    setInvoices(rows);
    setLoadingInvoices(false);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingInvoiceId(invoiceId);
    const extra = newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {};
    await supabase
      .from('dealer_invoices')
      .update({ status: newStatus, ...extra })
      .eq('id', invoiceId);
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: newStatus } : i));
    setUpdatingInvoiceId(null);
  };

  const handleAddInvoice = async () => {
    setSavingInvoice(true);
    setInvoiceError(null);
    const isTradeIn = addForm.commission_type === 'trade_in';
    const belopp = isTradeIn ? 6000 : 3000;
    const vatKr = Math.round(belopp * 0.25);
    const totalKr = belopp + vatKr;

    const { data: invNumData } = await supabase.rpc('next_invoice_number');
    const invoiceNumber = invNumData ?? `BLT-${new Date().getFullYear()}-MANUAL`;

    const { error: insertErr } = await supabase.from('dealer_invoices').insert({
      dealer_id: dealerId,
      status: 'pending',
      belopp,
      vat_kr: vatKr,
      total_kr: totalKr,
      commission_type: addForm.commission_type,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: addForm.due_date,
      description: addForm.description || (isTradeIn ? 'Förmedlingsavgift — Inbyte' : 'Förmedlingsavgift — Standard'),
    });

    if (insertErr) {
      setInvoiceError(insertErr.message);
    } else {
      setShowAddInvoice(false);
      setAddForm({ commission_type: 'standard', description: '', due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) });
      await loadInvoices();
    }
    setSavingInvoice(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const handleApprove = async () => {
    if (!dealer) return;
    setApproving(true);
    setEmailWarning(null);

    const { data: updated, error: updateError } = await supabase
      .from('dealers')
      .update({ godkand: true })
      .eq('id', dealer.id)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      setError('Kunde inte uppdatera handlaren.');
      setApproving(false);
      return;
    }

    setDealer(updated as Dealer);
    setApprovedJustNow(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-dealer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ dealer_id: dealer.id }),
        },
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setEmailWarning(body?.error ?? 'Välkomstmejlet kunde inte skickas.');
      }
    } catch {
      setEmailWarning('Välkomstmejlet kunde inte skickas.');
    }
    setApproving(false);
  };

  const breadcrumbEl = (
    <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 transition font-medium">
      <ChevronLeft className="w-4 h-4" />
      Tillbaka till handlare
    </button>
  );

  if (loading) {
    return (
      <PortalLayout navItems={[]} identity="Admin" identityRole="Bilto" onLogout={handleLogout} breadcrumb={breadcrumbEl}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </PortalLayout>
    );
  }

  if (error || !dealer) {
    return (
      <PortalLayout navItems={[]} identity="Admin" identityRole="Bilto" onLogout={handleLogout} breadcrumb={breadcrumbEl}>
        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-700 mb-6">{error ?? 'Handlaren hittades inte.'}</p>
            <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium">Tillbaka</button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const totalUnpaid = invoices
    .filter(i => i.status === 'pending' || i.status === 'invoiced' || i.status === 'overdue')
    .reduce((s, i) => s + (i.total_kr || i.belopp), 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  return (
    <PortalLayout navItems={[]} identity="Admin" identityRole="Bilto" onLogout={handleLogout} breadcrumb={breadcrumbEl}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Handlare</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{dealer.foretagsnamn}</h1>
              <p className="text-slate-500 mt-1 font-mono text-sm">{dealer.orgnr}</p>
            </div>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ring-1 ring-inset shrink-0 ${
              dealer.godkand ? 'bg-green-600 text-white ring-green-600' : 'bg-amber-50 text-amber-700 ring-amber-200'
            }`}>
              {dealer.godkand ? 'Godkänd' : 'Väntar'}
            </span>
          </div>

          {/* Dealer info */}
          <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="Företag" value={dealer.foretagsnamn} />
            <InfoRow icon={<Hash className="w-4 h-4" />} label="Moderbolag org.nr" value={dealer.moderbolag || dealer.orgnr} mono />
            {Array.isArray(dealer.organisationsnummer) && dealer.organisationsnummer.length > 0 && (
              <InfoRow icon={<Hash className="w-4 h-4" />} label="Alla organisationsnummer" value={
                <ul className="space-y-0.5">{dealer.organisationsnummer.map((o, i) => <li key={i} className="font-mono text-slate-900">{o}</li>)}</ul>
              } />
            )}
            {Array.isArray(dealer.adresser) && dealer.adresser.length > 0 && (
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Inköpsadresser" value={
                <ul className="space-y-0.5">{dealer.adresser.map((a, i) => <li key={i} className="text-slate-900">{a}</li>)}</ul>
              } />
            )}
            <InfoRow icon={<User className="w-4 h-4" />} label="Kontaktperson" value={[dealer.fornamn, dealer.efternamn].filter(Boolean).join(' ') || dealer.kontaktperson} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefon" value={dealer.telefon ? <a href={`tel:${dealer.telefon}`} className="text-slate-900 hover:text-slate-700">{dealer.telefon}</a> : '—'} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Mejl (inloggning)" value={dealer.mejl ? <a href={`mailto:${dealer.mejl}`} className="text-slate-900 hover:text-slate-700">{dealer.mejl}</a> : '—'} />
            {dealer.faktura_epost && (
              <InfoRow icon={<Receipt className="w-4 h-4" />} label="Faktura-e-post" value={<a href={`mailto:${dealer.faktura_epost}`} className="text-slate-900 hover:text-slate-700">{dealer.faktura_epost}</a>} />
            )}
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Ansökan inkom" value={formatDate(dealer.created_at)} />
          </div>

          {/* Approval */}
          <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-8 shadow-sm">
            {dealer.godkand ? (
              <div className="flex items-start gap-3 text-slate-700">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Handlaren är godkänd</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {approvedJustNow ? 'Välkomstmejl har skickats med inloggningslänk.' : 'Handlaren kan logga in och lägga bud.'}
                  </p>
                  {emailWarning && (
                    <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{emailWarning}</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Godkänn handlare</h2>
                <p className="text-sm text-slate-500 mb-5">Handlaren får tillgång till att lägga bud och ett välkomstmejl med inloggningslänk.</p>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="inline-flex items-center gap-2 h-11 bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-[14px] rounded-full px-5 transition"
                >
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {approving ? 'Godkänner…' : 'Godkänn handlare'}
                </button>
              </div>
            )}
          </div>

          {/* ── Förmedlingsavgifter ── */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Förmedlingsavgifter</h2>
                  {invoices.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {invoices.length} faktura{invoices.length !== 1 ? 'r' : ''}
                      {totalUnpaid > 0 && ` · ${totalUnpaid.toLocaleString('sv-SE')} kr utestående`}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAddInvoice(v => !v)}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                {showAddInvoice ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddInvoice ? 'Avbryt' : 'Ny faktura'}
              </button>
            </div>

            {/* Overdue alert */}
            {overdueInvoices.length > 0 && (
              <div className="flex items-center gap-3 px-5 sm:px-8 py-3 bg-red-50 border-b border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-medium">
                  {overdueInvoices.length} förfallen{overdueInvoices.length !== 1 ? 'a' : ''} faktura{overdueInvoices.length !== 1 ? 'r' : ''}
                </p>
              </div>
            )}

            {/* Add invoice form */}
            {showAddInvoice && (
              <div className="px-5 sm:px-8 py-5 bg-slate-50 border-b border-slate-100 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Ny manuell faktura</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Typ</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'standard', label: 'Standard', sub: '3 000 kr + moms' },
                        { value: 'trade_in', label: 'Inbyte', sub: '6 000 kr + moms' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAddForm(f => ({ ...f, commission_type: opt.value }))}
                          className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                            addForm.commission_type === opt.value
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                          <div className={`text-[11px] mt-0.5 ${addForm.commission_type === opt.value ? 'text-slate-300' : 'text-slate-400'}`}>{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Förfallodatum</label>
                    <input
                      type="date"
                      value={addForm.due_date}
                      onChange={e => setAddForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Beskrivning (valfritt)</label>
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="t.ex. Förmedlingsavgift — Volvo XC60 2022"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="text-sm text-slate-600">
                    Belopp: <span className="font-bold text-slate-900">{(addForm.commission_type === 'trade_in' ? 7500 : 3750).toLocaleString('sv-SE')} kr</span> inkl. moms
                  </div>
                  <button
                    onClick={handleAddInvoice}
                    disabled={savingInvoice}
                    className="ml-auto inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition disabled:opacity-50"
                  >
                    {savingInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Spara faktura
                  </button>
                </div>
                {invoiceError && <p className="text-sm text-red-600">{invoiceError}</p>}
              </div>
            )}

            {/* Invoice list */}
            {loadingInvoices ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Inga fakturor ännu. Fakturor skapas automatiskt när handlaren vinner en auktion.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const s = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.pending;
                  const transitions = STATUS_TRANSITIONS[inv.status] ?? [];
                  const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'cancelled';

                  return (
                    <div key={inv.id} className={`px-5 sm:px-8 py-4 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          inv.status === 'paid' ? 'bg-emerald-50' : isOverdue ? 'bg-red-50' : 'bg-slate-100'
                        }`}>
                          {inv.status === 'paid'
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            : isOverdue
                            ? <AlertTriangle className="w-4 h-4 text-red-500" />
                            : <Clock className="w-4 h-4 text-slate-400" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {inv.invoice_number && (
                              <span className="text-sm font-bold font-mono text-slate-900">{inv.invoice_number}</span>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${s.cls}`}>
                              {s.label}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${inv.commission_type === 'trade_in' ? 'bg-sky-50 text-sky-700 ring-sky-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                              {inv.commission_type === 'trade_in' ? 'Inbyte' : 'Standard'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {inv.description || (inv.car ? `${inv.car.marke} ${inv.car.modell} ${inv.car.ar ?? ''} · ${inv.car.regnummer}` : '—')}
                          </p>

                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                            {inv.invoice_date && <span>Fakturadatum: {formatDateShort(inv.invoice_date)}</span>}
                            {inv.due_date && (
                              <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                Förfaller: {formatDateShort(inv.due_date)}
                              </span>
                            )}
                            <span>Skapad: {formatDateShort(inv.created_at)}</span>
                          </div>

                          {/* Status transition buttons */}
                          {transitions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {transitions.map(tr => (
                                <button
                                  key={tr.next}
                                  onClick={() => updateInvoiceStatus(inv.id, tr.next)}
                                  disabled={updatingInvoiceId === inv.id}
                                  className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold transition disabled:opacity-50 ${tr.cls}`}
                                >
                                  {updatingInvoiceId === inv.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    tr.label
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-base font-bold text-slate-900 tabular-nums">
                            {(inv.total_kr || inv.belopp).toLocaleString('sv-SE')} kr
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {inv.belopp.toLocaleString('sv-SE')} + {(inv.vat_kr ?? 0).toLocaleString('sv-SE')} moms
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </PortalLayout>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}
