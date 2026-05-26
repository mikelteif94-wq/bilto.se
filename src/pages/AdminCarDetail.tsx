import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  User,
  X,
  EyeOff,
  Eye,
  Trash2,
  Gavel,
  Check,
  Pencil,
  Repeat,
  Send,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import PortalLayout from '../components/PortalLayout';
import CrmPanel from '../components/CrmPanel';
import BidsPanel from '../components/BidsPanel';
import DealerDispatchPanel from '../components/DealerDispatchPanel';
import LeadTimeline from '../components/LeadTimeline';
import ConditionReportForm, { EMPTY_CONDITION_REPORT } from '../components/forms/ConditionReportForm';
import type { ConditionReport } from '../components/forms/ConditionReportForm';

interface AdminCarDetailProps {
  carId: string;
  onBack: () => void;
  onLoggedOut: () => void;
  onCreateProposal?: (carId: string) => void;
}

type Car = Database['public']['Tables']['cars']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type CarImage = Database['public']['Tables']['car_images']['Row'];

interface CarDetail extends Car {
  customers: Customer | null;
  car_images: CarImage[];
}

const SKICK_LABELS: Record<string, string> = {
  mycket_bra: 'Mycket bra',
  bra: 'Bra',
  okej: 'Okej',
  ok: 'OK',
  slitet: 'Slitet',
  skadat: 'Skadat',
  utmärkt: 'Utmärkt',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AdminCarDetail({
  carId,
  onBack,
  onLoggedOut,
  onCreateProposal,
}: AdminCarDetailProps) {
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);

  const [editingStartbud, setEditingStartbud] = useState(false);
  const [startbudInput, setStartbudInput] = useState('');
  const [savingStartbud, setSavingStartbud] = useState(false);

  const [editingTradeIn, setEditingTradeIn] = useState(false);
  const [tradeInInterestDraft, setTradeInInterestDraft] = useState(false);
  const [tradeInWantsInput, setTradeInWantsInput] = useState('');
  const [savingTradeIn, setSavingTradeIn] = useState(false);

  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'crm' | 'timeline'>('crm');

  useEffect(() => {
    void fetchCar();
  }, [carId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAdminUserId(user.id);
      const { data } = await supabase
        .from('admin_users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      setAdminName(data?.name ?? user.email?.split('@')[0] ?? 'Admin');
    })();
  }, []);

  const fetchCar = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('cars')
      .select('*, customers(*), car_images(*)')
      .eq('id', carId)
      .maybeSingle();

    if (fetchError || !data) {
      setError('Kunde inte hämta bilen.');
      setLoading(false);
      return;
    }

    const detail = data as CarDetail;
    detail.car_images = [...(detail.car_images ?? [])].sort(
      (a, b) => a.ordning - b.ordning,
    );
    setCar(detail);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const toggleHidden = async () => {
    if (!car) return;
    setBusy(true);
    const { error: updErr } = await supabase
      .from('cars')
      .update({ hidden_from_dealers: !car.hidden_from_dealers } as never)
      .eq('id', car.id);
    setBusy(false);
    if (updErr) {
      setError('Kunde inte uppdatera synlighet.');
      return;
    }
    setCar({ ...car, hidden_from_dealers: !car.hidden_from_dealers });
  };

  const saveStartbud = async () => {
    if (!car) return;
    const cleaned = startbudInput.replace(/\s/g, '').replace(/,/g, '.');
    const parsed = cleaned === '' ? null : Math.floor(Number(cleaned));
    if (cleaned !== '' && (!Number.isFinite(parsed) || (parsed as number) < 0)) {
      setError('Ange ett giltigt belopp i kronor.');
      return;
    }
    setSavingStartbud(true);
    setError(null);
    const { error: updErr } = await supabase
      .from('cars')
      .update({ startbud: parsed } as never)
      .eq('id', car.id);
    setSavingStartbud(false);
    if (updErr) {
      setError('Kunde inte spara startbud.');
      return;
    }
    setCar({ ...car, startbud: parsed } as CarDetail);
    setEditingStartbud(false);
  };

  const saveTradeIn = async (interest: boolean, wants: string) => {
    if (!car) return;
    setSavingTradeIn(true);
    setError(null);
    const wasInterested = car.trade_in_interest;
    const { error: updErr } = await supabase
      .from('cars')
      .update({
        trade_in_interest: interest,
        trade_in_wants: interest ? wants.trim() : '',
      } as never)
      .eq('id', car.id);
    setSavingTradeIn(false);
    if (updErr) {
      setError('Kunde inte spara inbyte.');
      return;
    }
    if (interest && !wasInterested && adminUserId) {
      await supabase.from('car_activities').insert({
        car_id: car.id,
        type: 'note',
        title: 'Inbytes-lead: Kunden vill byta till annan bil',
        body: wants.trim() || '(Ingen önskebil angiven)',
        data: { source: 'admin_detail', kind: 'trade_in_lead' },
        created_by: adminUserId,
        created_by_name: adminName,
      });
    }
    setCar({
      ...car,
      trade_in_interest: interest,
      trade_in_wants: interest ? wants.trim() : '',
    } as CarDetail);
    setEditingTradeIn(false);
  };

  const deleteCar = async () => {
    if (!car) return;
    setBusy(true);
    const { error: delErr } = await supabase.from('cars').delete().eq('id', car.id);
    setBusy(false);
    if (delErr) {
      setError('Kunde inte ta bort bilen.');
      return;
    }
    onBack();
  };

  return (
    <PortalLayout
      navItems={[]}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      breadcrumb={
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-900 transition font-medium">
          <ChevronLeft className="w-4 h-4" />
          Tillbaka till bilar
        </button>
      }
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : error && !car ? (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : car ? (
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
          <div className="mb-5 sm:mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {[car.marke, car.modell].filter(Boolean).join(' ') || 'Bil'}
                </h1>
                <span className="font-mono text-base sm:text-lg font-semibold text-slate-500 tracking-wider">
                  {car.regnummer}
                </span>
              </div>
              {onCreateProposal && (
                <button
                  onClick={() => onCreateProposal(carId)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-sm font-semibold transition shadow-sm shrink-0"
                >
                  <Send className="w-4 h-4" />
                  Skicka handlarförslag
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500">Inkom {formatDate(car.created_at)}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 sm:gap-8">
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              {car.car_images.length > 0 && (
                <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                  <img
                    src={car.car_images[0].storage_url}
                    alt="Huvudbild"
                    onClick={() => setLightboxUrl(car.car_images[0].storage_url)}
                    className="w-full h-56 sm:h-96 object-cover cursor-zoom-in"
                  />
                  {car.car_images.length > 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-2">
                      {car.car_images.slice(1).map((img) => (
                        <img
                          key={img.id}
                          src={img.storage_url}
                          alt=""
                          onClick={() => setLightboxUrl(img.storage_url)}
                          className="w-full h-20 sm:h-24 object-cover rounded-lg cursor-zoom-in hover:opacity-80 transition"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 sm:mb-5">
                  Bilinformation
                </h2>
                <dl className="grid grid-cols-2 gap-y-4 sm:gap-y-5 gap-x-4 sm:gap-x-8">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Regnummer
                    </dt>
                    <dd className="font-mono font-semibold text-slate-900 tracking-wider">
                      {car.regnummer}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Märke
                    </dt>
                    <dd className="text-slate-900">
                      {car.marke || <span className="text-slate-400">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Modell
                    </dt>
                    <dd className="text-slate-900">
                      {car.modell || <span className="text-slate-400">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Årsmodell
                    </dt>
                    <dd className="text-slate-900">{car.ar || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Miltal
                    </dt>
                    <dd className="text-slate-900">
                      {car.miltal.toLocaleString('sv-SE')} mil
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Skick
                    </dt>
                    <dd className="text-slate-900">
                      {SKICK_LABELS[car.skick] ?? car.skick}
                    </dd>
                  </div>
                  <>
                      {(car as unknown as { skick_kommentar?: string }).skick_kommentar && (
                        <div className="col-span-2">
                          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Skickbeskrivning
                          </dt>
                          <dd className="text-slate-900 whitespace-pre-wrap text-sm">
                            {(car as unknown as { skick_kommentar: string }).skick_kommentar}
                          </dd>
                        </div>
                      )}
                      {((car as unknown as { utrustning?: string[] }).utrustning ?? []).length > 0 && (
                        <div className="col-span-2">
                          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Utrustning
                          </dt>
                          <dd className="flex flex-wrap gap-1.5 mt-1">
                            {((car as unknown as { utrustning: string[] }).utrustning ?? []).map((u) => (
                              <span
                                key={u}
                                className="inline-block text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full"
                              >
                                {u}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                  </>
                </dl>
              </div>

              {(() => {
                const raw = (car as unknown as { condition_report?: Record<string, unknown> }).condition_report;
                if (!raw) return null;
                const report: ConditionReport = {
                  ...EMPTY_CONDITION_REPORT,
                  ...raw,
                  mekaniskt: (raw.mekaniskt as Record<string, string>) ?? {},
                  kosmetiskt: (raw.kosmetiskt as Record<string, string>) ?? {},
                  inredning: (raw.inredning as Record<string, string>) ?? {},
                  historik: { ...EMPTY_CONDITION_REPORT.historik, ...(raw.historik as object ?? {}) },
                  kommentarer: { ...EMPTY_CONDITION_REPORT.kommentarer, ...(raw.kommentarer as object ?? {}) },
                };
                return (
                  <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setReportOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-slate-50 transition text-left"
                    >
                      <h2 className="text-base font-bold text-slate-900">Skickrapport</h2>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${reportOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {reportOpen && (
                      <div className="border-t border-slate-100 px-5 sm:px-6 py-5">
                        <ConditionReportForm value={report} onChange={() => {}} readOnly collapsibleSections />
                      </div>
                    )}
                  </div>
                );
              })()}

              <BidsPanel
                carId={car.id}
                customerName={car.customers?.namn ?? ''}
                customerEmail={car.customers?.mejl ?? ''}
                customerPhone={car.customers?.telefon ?? ''}
                winningBidId={car.vinnande_bud_id ?? null}
                carStatus={car.status}
                onChanged={() => fetchCar()}
              />

              {/* CRM / Timeline / Dispatch tabs */}
              <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                {/* Tab strip */}
                <div className="flex border-b border-slate-100">
                  {([
                    { key: 'crm',      label: 'CRM & Dispatch' },
                    { key: 'timeline', label: 'Tidslinje', icon: Clock },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? 'border-[#0e6efe] text-[#0e6efe]'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {'icon' in tab && tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'crm' && (
                  <div className="p-5 sm:p-6 space-y-6">
                    <CrmPanel
                      carId={car.id}
                      customerName={car.customers?.namn ?? ''}
                      adminUserId={adminUserId}
                      adminName={adminName}
                      carStatus={car.status}
                      carNotes={car.notes ?? ''}
                      onCarUpdated={(changes) =>
                        setCar((prev) => (prev ? { ...prev, ...changes } : prev))
                      }
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-4">Dealer Dispatch</h3>
                      <DealerDispatchPanel
                        carId={car.id}
                        adminUserId={adminUserId ?? ''}
                        adminName={adminName}
                        itemLabel={[car.marke, car.modell, car.ar].filter(Boolean).join(' ') || car.regnummer}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && adminUserId && (
                  <LeadTimeline
                    leadType="car"
                    leadId={car.id}
                    adminUserId={adminUserId}
                    adminName={adminName}
                    inline
                  />
                )}
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Gavel className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-bold text-slate-900">Startbud</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Synligt för handlare på annonsen. Lägsta nivå för budgivning.
                </p>

                {editingStartbud ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={startbudInput}
                        onChange={(e) => setStartbudInput(e.target.value)}
                        placeholder="0"
                        autoFocus
                        className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-sm font-medium">
                        kr
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveStartbud}
                        disabled={savingStartbud}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition disabled:opacity-60"
                      >
                        {savingStartbud ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Spara
                      </button>
                      <button
                        onClick={() => setEditingStartbud(false)}
                        disabled={savingStartbud}
                        className="h-9 px-3 rounded-full border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      {car.startbud != null ? (
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">
                          {car.startbud.toLocaleString('sv-SE')} kr
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400">Inget startbud satt</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setStartbudInput(car.startbud != null ? String(car.startbud) : '');
                        setEditingStartbud(true);
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {car.startbud != null ? 'Ändra' : 'Sätt startbud'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Repeat className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-bold text-slate-900">Inbyte / Bytbil</h2>
                  {car.trade_in_interest && (
                    <span className="ml-auto inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-200 uppercase tracking-wider">
                      Lead
                    </span>
                  )}
                </div>

                {(() => {
                  const c = car as unknown as {
                    trade_in_interest?: boolean;
                    trade_target_brand?: string;
                    trade_target_model?: string;
                    trade_target_free?: string;
                    trade_target_budget?: number | null;
                    trade_target_fuel?: string;
                    trade_target_payment?: string;
                    deal_readiness?: string;
                  };

                  const FUEL_LABELS: Record<string, string> = {
                    petrol: 'Bensin', diesel: 'Diesel', hybrid: 'Hybrid/Laddhybrid',
                    electric: 'El', no_pref: 'Spelar ingen roll',
                  };
                  const PAYMENT_LABELS: Record<string, string> = { cash: 'Kontant', finance: 'Finansiering' };
                  const READINESS_LABELS: Record<string, string> = {
                    ready_now: 'Redo nu',
                    within_month: 'Inom en månad',
                    just_looking: 'Precis börjat kolla',
                  };

                  if (!c.trade_in_interest) {
                    return (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-400">Kunden vill inte byta bil</p>
                        <button
                          onClick={() => { setTradeInInterestDraft(true); setTradeInWantsInput(''); setEditingTradeIn(true); }}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Markera inbyte
                        </button>
                      </div>
                    );
                  }

                  const rows: { label: string; value: string }[] = [];
                  const brand = [c.trade_target_brand, c.trade_target_model].filter(Boolean).join(' ');
                  if (brand) rows.push({ label: 'Söker märke/modell', value: brand });
                  if (c.trade_target_free) rows.push({ label: 'Önskemål', value: c.trade_target_free });
                  if (c.trade_target_budget) rows.push({ label: 'Max budget', value: `${c.trade_target_budget.toLocaleString('sv-SE')} kr` });
                  if (c.trade_target_fuel) rows.push({ label: 'Drivmedel', value: FUEL_LABELS[c.trade_target_fuel] ?? c.trade_target_fuel });
                  if (c.trade_target_payment) rows.push({ label: 'Betalning', value: PAYMENT_LABELS[c.trade_target_payment] ?? c.trade_target_payment });

                  return (
                    <div className="space-y-3">
                      {rows.length > 0 ? (
                        <dl className="divide-y divide-slate-100 text-sm rounded-lg border border-slate-100 overflow-hidden">
                          {rows.map(r => (
                            <div key={r.label} className="flex justify-between gap-3 px-4 py-2.5">
                              <dt className="text-slate-500 shrink-0">{r.label}</dt>
                              <dd className="font-semibold text-slate-900 text-right">{r.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Kunden vill byta bil men har inte angett önskemål.</p>
                      )}
                      {c.deal_readiness && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Redo att göra affär:</span>
                          <span className="font-semibold text-slate-900">{READINESS_LABELS[c.deal_readiness] ?? c.deal_readiness}</span>
                        </div>
                      )}
                      <button
                        onClick={() => { setTradeInInterestDraft(true); setTradeInWantsInput(car.trade_in_wants ?? ''); setEditingTradeIn(true); }}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Ändra
                      </button>
                    </div>
                  );
                })()}

                {editingTradeIn && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tradeInInterestDraft}
                        onChange={(e) => setTradeInInterestDraft(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#0e6efe]"
                      />
                      <span className="text-sm font-medium text-slate-800">Kunden vill byta till annan bil</span>
                    </label>
                    {tradeInInterestDraft && (
                      <textarea
                        rows={3}
                        value={tradeInWantsInput}
                        onChange={(e) => setTradeInWantsInput(e.target.value)}
                        placeholder="T.ex. Volvo XC60 hybrid, budget 350 000 kr"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none text-sm"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveTradeIn(tradeInInterestDraft, tradeInWantsInput)}
                        disabled={savingTradeIn}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition disabled:opacity-60"
                      >
                        {savingTradeIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Spara
                      </button>
                      <button
                        onClick={() => setEditingTradeIn(false)}
                        disabled={savingTradeIn}
                        className="h-9 px-3 rounded-full border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deal readiness */}
              {(() => {
                const readiness = (car as unknown as { deal_readiness?: string }).deal_readiness;
                if (!readiness) return null;
                const READINESS_LABELS: Record<string, { label: string; color: string }> = {
                  ready_now:    { label: 'Redo att göra affär nu',      color: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
                  within_month: { label: 'Inom en månad',               color: 'bg-blue-100 text-blue-800 ring-blue-200' },
                  just_looking: { label: 'Precis börjat kolla',         color: 'bg-slate-100 text-slate-600 ring-slate-200' },
                };
                const info = READINESS_LABELS[readiness];
                return (
                  <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6 flex items-center gap-3">
                    <Send className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Affärsberedskap</p>
                      <span className={`inline-flex items-center text-[13px] font-semibold px-3 py-1 rounded-full ring-1 ${info?.color ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                        {info?.label ?? readiness}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Synlighet</h2>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {car.hidden_from_dealers ? 'Dold för handlare' : 'Synlig för handlare'}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {car.hidden_from_dealers
                        ? 'Bilen visas inte i handlarnas marknadsplats.'
                        : 'Bilen kan ses och budges på av godkända handlare.'}
                    </p>
                  </div>
                  <button
                    onClick={toggleHidden}
                    disabled={busy}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold transition ${
                      car.hidden_from_dealers
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } disabled:opacity-50`}
                  >
                    {car.hidden_from_dealers ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Visa
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Dölj
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Säljare</h2>
                {car.customers ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-900 font-medium">
                        {car.customers.namn}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <a
                        href={`tel:${car.customers.telefon}`}
                        className="text-slate-700 hover:text-slate-900 transition"
                      >
                        {car.customers.telefon}
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        <a
                          href={`mailto:${car.customers.mejl}`}
                          className="text-slate-700 hover:text-slate-900 transition break-all"
                        >
                          {car.customers.mejl}
                        </a>
                        {(car.customers as { email_verified?: boolean }).email_verified
                          ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 self-start">
                              <ShieldCheck className="w-3 h-3" />
                              E-post verifierad
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 self-start">
                              <ShieldAlert className="w-3 h-3" />
                              E-post overifierad
                            </span>
                          )
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Ingen kund kopplad.</p>
                )}
              </div>

              <div className="bg-white rounded-md border border-red-200 p-5 sm:p-6">
                <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-2">
                  Farozon
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Tar bort bilen, alla bud och bilder permanent. Går inte att ångra.
                </p>
                {confirmDelete ? (
                  <div className="space-y-2">
                    <button
                      onClick={deleteCar}
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Ja, ta bort permanent
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={busy}
                      className="w-full h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-red-300 text-red-700 hover:bg-red-50 font-semibold text-sm transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ta bort bil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
      </div>
    </PortalLayout>
  );
}
