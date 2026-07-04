import { useEffect, useState, useCallback } from 'react';
import {
  X, Loader2, ChevronLeft, ChevronRight, AlertCircle,
  ExternalLink, Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigate } from './StaffShell';

interface Props {
  carId: string;
  onClose: () => void;
  /** If provided, show internal columns (prisgolv etc.) */
  isInternal?: boolean;
}

interface Car {
  id: string;
  regnummer: string | null;
  marke: string;
  modell: string;
  ar: number;
  miltal: number | null;
  skick: string | null;
  pool_status: string | null;
  pool_utpris: number | null;
  pool_prisgolv: number | null;
  available_for_staff_sales: boolean;
  pool_added_at: string | null;
  created_at: string;
  dealers: { id: string; foretagsnamn: string; ort?: string | null } | null;
  car_images: { storage_url: string; ordning: number }[];
}

interface Customer {
  id: string;
  namn: string;
  telefon: string | null;
  mejl: string | null;
  role?: string;
  last_event?: string;
}

interface RelatedDeal {
  id: string;
  deal_number: string | null;
  deal_type: string;
  status: string;
  assigned_staff_user_id: string | null;
  created_at: string;
  customers: { namn: string } | null;
}

interface LogEntry {
  id: string;
  event_type: string;
  actor_name: string | null;
  payload_json: Record<string, unknown>;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  available:  'Tillgänglig',
  reserved:   'Reserverad',
  sold:       'Såld',
  paused:     'Pausad',
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  available: { bg: '#E1F5EE', text: '#085041' },
  reserved:  { bg: '#FAEEDA', text: '#854F0B' },
  sold:      { bg: '#F7F6F3', text: '#6E6D68' },
  paused:    { bg: '#F7F6F3', text: '#6E6D68' },
};

const DEAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast', sent_for_approval: 'Väntar godkännande',
  approved: 'Godkänd', reserved: 'Reserverad', handed_over: 'Levererad',
  cancelled: 'Avbruten', rejected: 'Avvisad',
};

const DEAL_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:             { bg: '#F7F6F3', text: '#6E6D68' },
  sent_for_approval: { bg: '#E6F1FB', text: '#0C447C' },
  approved:          { bg: '#E1F5EE', text: '#085041' },
  reserved:          { bg: '#FAEEDA', text: '#854F0B' },
  handed_over:       { bg: '#EAF3DE', text: '#27500A' },
  cancelled:         { bg: '#F7F6F3', text: '#6E6D68' },
  rejected:          { bg: '#FCEBEB', text: '#791F1F' },
};

function fmtKr(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

function daysInStock(addedAt: string | null, createdAt: string) {
  const d = new Date(addedAt ?? createdAt).getTime();
  return Math.floor((Date.now() - d) / 86400000);
}

type Tab = 'info' | 'customers' | 'deals' | 'log';

export default function BilkortsModal({ carId, onClose, isInternal = true }: Props) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');
  const [imgIdx, setImgIdx] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<RelatedDeal[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logLoaded, setLogLoaded] = useState(false);
  const [logComment, setLogComment] = useState('');
  const [logSaving, setLogSaving] = useState(false);

  const loadCar = useCallback(async () => {
    const { data } = await supabase
      .from('cars')
      .select(`
        id, regnummer, marke, modell, ar, miltal, skick,
        pool_status, pool_utpris, pool_prisgolv,
        available_for_staff_sales, pool_added_at, created_at,
        dealers(id, foretagsnamn),
        car_images(storage_url, ordning)
      `)
      .eq('id', carId)
      .maybeSingle();
    if (data) {
      const c = data as unknown as Car;
      c.car_images = (c.car_images ?? []).sort((a, b) => a.ordning - b.ordning);
      setCar(c);
    }
    setLoading(false);
  }, [carId]);

  const loadCustomers = useCallback(async () => {
    // Find customers via valuations or deals linked to this car
    const { data: dealData } = await supabase
      .from('deals')
      .select('id, customers(id, namn, telefon, mejl), status')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });
    const seen = new Set<string>();
    const list: Customer[] = [];
    (dealData ?? []).forEach((d: { id: string; customers: { id: string; namn: string; telefon: string | null; mejl: string | null } | null; status: string }) => {
      if (d.customers && !seen.has(d.customers.id)) {
        seen.add(d.customers.id);
        list.push({ ...d.customers, role: ['reserved','handed_over'].includes(d.status) ? 'Köpare' : 'Intressent', last_event: d.status });
      }
    });
    setCustomers(list);
  }, [carId]);

  const loadDeals = useCallback(async () => {
    const { data } = await supabase
      .from('deals')
      .select('id, deal_number, deal_type, status, assigned_staff_user_id, created_at, customers(namn)')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });
    setDeals((data ?? []) as unknown as RelatedDeal[]);
  }, [carId]);

  const loadLog = useCallback(async () => {
    // Get all deal_ids for this car, then load events
    const { data: dealIds } = await supabase
      .from('deals')
      .select('id')
      .eq('car_id', carId);
    const ids = (dealIds ?? []).map((d: { id: string }) => d.id);
    if (ids.length === 0) { setLogLoaded(true); return; }
    const { data } = await supabase
      .from('deal_events')
      .select('id, event_type, actor_name, payload_json, created_at')
      .in('deal_id', ids)
      .order('created_at', { ascending: false })
      .limit(60);
    setLogEntries((data ?? []) as LogEntry[]);
    setLogLoaded(true);
  }, [carId]);

  useEffect(() => { loadCar(); }, [loadCar]);

  useEffect(() => {
    if (tab === 'customers') loadCustomers();
    else if (tab === 'deals') loadDeals();
    else if (tab === 'log' && !logLoaded) loadLog();
  }, [tab, loadCustomers, loadDeals, loadLog, logLoaded]);

  async function addLogComment() {
    if (!logComment.trim()) return;
    const { data: dealIds } = await supabase.from('deals').select('id').eq('car_id', carId).limit(1);
    const dealId = dealIds?.[0]?.id;
    if (!dealId) return;
    setLogSaving(true);
    await supabase.from('deal_events').insert({
      deal_id: dealId,
      event_type: 'comment',
      actor_type: 'staff',
      actor_name: 'Manuell kommentar',
      payload_json: { comment: logComment.trim() },
    });
    setLogComment('');
    await loadLog();
    setLogSaving(false);
  }

  const imgs = car?.car_images ?? [];
  const days = car ? daysInStock(car.pool_added_at, car.created_at) : 0;
  const prisgolv = car?.pool_prisgolv;
  const utpris = car?.pool_utpris;
  const utrymme = utpris && prisgolv ? utpris - prisgolv : null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'info',      label: 'Info' },
    { id: 'customers', label: 'Kunder', count: customers.length || undefined },
    { id: 'deals',     label: 'Affärer', count: deals.length || undefined },
    { id: 'log',       label: 'Logg', count: logEntries.length || undefined },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-3xl rounded-xl relative"
        style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg z-10" style={{ color: '#6E6D68', background: '#F7F6F3' }}>
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : !car ? (
          <div className="flex items-center justify-center h-64 gap-2" style={{ color: '#6E6D68' }}>
            <AlertCircle className="w-5 h-5" /> Bilen hittades inte.
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-center gap-2 flex-wrap pr-8">
                {car.regnummer && (
                  <span className="text-[12px] font-medium px-2 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                    {car.regnummer}
                  </span>
                )}
                <h2 className="text-[18px] font-medium" style={{ color: '#1C1C1A' }}>
                  {car.marke} {car.modell} {car.ar}
                </h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ ...(STATUS_STYLE[car.pool_status ?? 'available'] ?? STATUS_STYLE.available), borderRadius: 100 }}>
                  {STATUS_LABELS[car.pool_status ?? 'available'] ?? car.pool_status}
                </span>
              </div>
              {car.dealers && (
                <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>{car.dealers.foretagsnamn}</p>
              )}
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b" style={{ borderColor: '#E5E4E0' }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-1 py-2.5 mr-5 text-[13px] transition"
                  style={{
                    color: tab === t.id ? '#0F6E56' : '#6E6D68',
                    borderBottom: tab === t.id ? '2px solid #0F6E56' : '2px solid transparent',
                    fontWeight: tab === t.id ? 500 : 400,
                  }}
                >
                  {t.label}
                  {t.count != null && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#F7F6F3', color: '#6E6D68' }}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: INFO */}
            {tab === 'info' && (
              <div className="p-6">
                {/* Image gallery */}
                {imgs.length > 0 && (
                  <div className="mb-5">
                    <div className="relative rounded-lg overflow-hidden mb-2" style={{ aspectRatio: '16/9', background: '#F7F6F3' }}>
                      <img src={imgs[imgIdx]?.storage_url} alt="" className="w-full h-full object-cover" />
                      {imgs.length > 1 && (
                        <>
                          <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: '#FFF' }}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: '#FFF' }}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {imgs.map((img, i) => (
                        <button key={img.storage_url} onClick={() => setImgIdx(i)}
                          className="shrink-0 rounded overflow-hidden"
                          style={{ width: 52, height: 36, border: i === imgIdx ? '2px solid #0F6E56' : '2px solid transparent' }}>
                          <img src={img.storage_url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {days > 90 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: '#FCEBEB', color: '#791F1F' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[12px]">Bilen har legat i lager i {days} dagar – överstiger varningsgränsen på 90 dagar.</span>
                  </div>
                )}

                {/* Data */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
                  {([
                    ['Handlare', car.dealers?.foretagsnamn],
                    ['Utpris', utpris ? fmtKr(utpris) : null],
                    ['Miltal', car.miltal ? car.miltal.toLocaleString('sv-SE') + ' mil' : null],
                    ['Årsmodell', car.ar],
                    ['Dagar i lager', days],
                    ['Poolstatus', STATUS_LABELS[car.pool_status ?? 'available']],
                    ...(isInternal ? [
                      ['Prisgolv', prisgolv ? fmtKr(prisgolv) : null],
                      ['Rabattutrymme', utrymme != null ? fmtKr(utrymme) : null],
                    ] : []),
                  ] as [string, string | number | null][]).filter(([, v]) => v != null).map(([label, value]) => (
                    <div key={label} className="py-1">
                      <div className="text-[11px]" style={{ color: '#6E6D68' }}>{label}</div>
                      <div className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid #E5E4E0' }}>
                  <button
                    onClick={() => { onClose(); navigate(`/staff/affarer/ny?carId=${car.id}`); }}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium"
                    style={{ background: '#FAEEDA', color: '#854F0B' }}>
                    Skapa affär
                  </button>
                  {deals.length > 0 && (
                    <button
                      onClick={() => setTab('deals')}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium"
                      style={{ background: '#1C1C1A', color: '#FFFFFF' }}>
                      Visa affär <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab: CUSTOMERS */}
            {tab === 'customers' && (
              <div>
                {customers.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[13px]" style={{ color: '#6E6D68' }}>
                    Inga kunder kopplade till den här bilen.
                  </div>
                ) : (
                  customers.map((c, idx) => (
                    <div key={c.id} className="px-6 py-4 flex items-center gap-3"
                      style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0" style={{ background: '#EEF7F4', color: '#0F6E56' }}>
                        {c.namn[0] ?? 'K'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{c.namn}</span>
                          {c.role && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#E6F1FB', color: '#0C447C', borderRadius: 100 }}>{c.role}</span>
                          )}
                        </div>
                        <p className="text-[12px]" style={{ color: '#6E6D68' }}>{c.mejl ?? '—'}</p>
                      </div>
                      {c.telefon && (
                        <a href={`tel:${c.telefon}`} className="p-1.5 rounded-lg" style={{ color: '#6E6D68', border: '1px solid #E5E4E0' }}>
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: DEALS */}
            {tab === 'deals' && (
              <div>
                {deals.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-[13px] mb-3" style={{ color: '#6E6D68' }}>Inga affärer kopplade till bilen.</p>
                    <button
                      onClick={() => { onClose(); navigate(`/staff/affarer/ny?carId=${car?.id}`); }}
                      className="px-4 h-9 rounded-lg text-[13px] font-medium"
                      style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                      Skapa affär
                    </button>
                  </div>
                ) : (
                  deals.map((d, idx) => {
                    const s = DEAL_STATUS_STYLE[d.status] ?? DEAL_STATUS_STYLE.draft;
                    return (
                      <button
                        key={d.id}
                        onClick={() => { onClose(); navigate(`/staff/affarer/${d.id}`); }}
                        className="w-full px-6 py-4 flex items-center gap-3 text-left transition hover:bg-[#F7F6F3]"
                        style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {d.deal_number && (
                              <span className="text-[11px]" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6E6D68' }}>{d.deal_number}</span>
                            )}
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ ...s, borderRadius: 100 }}>
                              {DEAL_STATUS_LABELS[d.status] ?? d.status}
                            </span>
                          </div>
                          <p className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>{d.customers?.namn ?? '—'}</p>
                          <p className="text-[12px]" style={{ color: '#6E6D68' }}>
                            {new Date(d.created_at).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: '#6E6D68' }} />
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab: LOG */}
            {tab === 'log' && (
              <div>
                <div className="px-6 pt-4 pb-3" style={{ borderBottom: '1px solid #E5E4E0' }}>
                  <textarea
                    value={logComment}
                    onChange={e => setLogComment(e.target.value)}
                    placeholder="Skriv kommentar..."
                    rows={2}
                    className="w-full px-3 py-2 text-[13px] focus:outline-none rounded-lg resize-none"
                    style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A', borderRadius: 8 }}
                  />
                  <button
                    onClick={addLogComment}
                    disabled={!logComment.trim() || logSaving}
                    className="mt-1.5 px-3 h-7 rounded-lg text-[12px] font-medium"
                    style={{ background: logComment.trim() ? '#0F6E56' : '#F7F6F3', color: logComment.trim() ? '#FFF' : '#6E6D68' }}>
                    {logSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lägg till'}
                  </button>
                </div>
                <div>
                  {!logLoaded && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6E6D68' }} />
                    </div>
                  )}
                  {logLoaded && logEntries.length === 0 && (
                    <p className="px-6 py-8 text-[13px] text-center" style={{ color: '#6E6D68' }}>Ingen logg tillgänglig.</p>
                  )}
                  {logEntries.map((entry, idx) => (
                    <div key={entry.id} className="px-6 py-3 flex items-start gap-3"
                      style={{ borderTop: idx > 0 ? '1px solid #F7F6F3' : undefined }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: entry.event_type === 'comment' ? '#0F6E56' : '#6E6D68' }} />
                      <div>
                        <p className="text-[11px]" style={{ color: '#6E6D68' }}>
                          {new Date(entry.created_at).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          {entry.actor_name ? ` · ${entry.actor_name}` : ''}
                        </p>
                        <p className="text-[13px] mt-0.5" style={{ color: '#1C1C1A' }}>
                          {entry.event_type === 'comment' ? (entry.payload_json.comment as string) : entry.event_type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
