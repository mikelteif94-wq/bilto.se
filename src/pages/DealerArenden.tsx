import { useEffect, useState } from 'react';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import DealerPortalShell, { dealerNavigate } from '../components/DealerPortalShell';
import { supabase } from '../lib/supabase';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface Arende {
  id: string;
  deal_number: string | null;
  deal_type: string;
  status: string;
  updated_at: string;
  customers: { namn: string; telefon: string | null } | null;
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
  draft:             { bg: '#F7F6F3', text: '#6E6D68' },
  sent_for_approval: { bg: '#E6F1FB', text: '#0C447C' },
  approved:          { bg: '#E1F5EE', text: '#085041' },
  rejected:          { bg: '#FCEBEB', text: '#791F1F' },
  reserved:          { bg: '#FAEEDA', text: '#854F0B' },
  handed_over:       { bg: '#EAF3DE', text: '#27500A' },
  cancelled:         { bg: '#F7F6F3', text: '#6E6D68' },
};

const TYPE_LABELS: Record<string, string> = {
  kop: 'Köp', inkop: 'Inköp', byte: 'Byte',
};

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

export default function DealerArenden({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const [arenden, setArenden] = useState<Arende[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDeal, setOpenDeal] = useState<Arende | null>(null);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [confirmDeliver, setConfirmDeliver] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('deals')
        .select('id, deal_number, deal_type, status, updated_at, customers(namn, telefon), cars(marke, modell, ar, regnummer)')
        .eq('dealer_id', dealerId)
        .not('status', 'in', '(cancelled)')
        .order('updated_at', { ascending: false });
      setArenden((data ?? []) as unknown as Arende[]);
      setLoading(false);
    })();
  }, [dealerId]);

  const filtered = arenden.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.cars ? `${a.cars.marke} ${a.cars.modell}` : '').toLowerCase().includes(q) ||
      (a.cars?.regnummer ?? '').toLowerCase().includes(q) ||
      (a.customers?.namn ?? '').toLowerCase().includes(q) ||
      (a.deal_number ?? '').toLowerCase().includes(q)
    );
  });

  async function markDelivered(deal: Arende) {
    setMarkingDelivered(true);
    await supabase.from('deals').update({ status: 'handed_over', updated_at: new Date().toISOString() }).eq('id', deal.id);
    await supabase.from('deal_events').insert({ deal_id: deal.id, event_type: 'handed_over', actor_type: 'dealer', actor_name: foretagsnamn, payload_json: {} });
    setOpenDeal(prev => prev ? { ...prev, status: 'handed_over' } : prev);
    setArenden(prev => prev.map(a => a.id === deal.id ? { ...a, status: 'handed_over' } : a));
    setMarkingDelivered(false);
    setConfirmDeliver(false);
  }

  return (
    <DealerPortalShell activePage="arenden" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div>
        <div className="mb-5">
          <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Ärenden</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>{arenden.length} totalt</p>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Sök regnummer, kund, ärendenr..."
          className="w-full h-9 px-3 rounded-lg text-[14px] focus:outline-none mb-4"
          style={{ border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A' }}
        />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[13px]" style={{ color: '#6E6D68' }}>Inga ärenden matchar.</div>
        ) : (
          <div style={cardStyle}>
            {filtered.map((a, idx) => {
              const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.draft;
              const showFullName = ['reserved', 'handed_over'].includes(a.status);
              return (
                <button
                  key={a.id}
                  onClick={() => setOpenDeal(a)}
                  className="w-full px-5 py-4 flex items-center gap-3 text-left transition hover:bg-[#F7F6F3]"
                  style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {a.cars?.regnummer && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                          {a.cars.regnummer}
                        </span>
                      )}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ ...s, borderRadius: 100 }}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#F7F6F3', color: '#6E6D68', borderRadius: 100 }}>
                        {TYPE_LABELS[a.deal_type] ?? a.deal_type}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium" style={{ color: '#1C1C1A' }}>
                      {a.cars ? `${a.cars.marke} ${a.cars.modell} ${a.cars.ar}` : 'Okänd bil'}
                    </p>
                    <p className="text-[12px]" style={{ color: '#6E6D68' }}>
                      {showFullName
                        ? (a.customers?.namn ?? '—')
                        : (a.customers?.namn?.split(' ')[0] ?? '—')}
                      {' · '}
                      {new Date(a.updated_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: '#E5E4E0' }} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Deal detail modal */}
      {openDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #E5E4E0' }}>
              <div className="flex items-center justify-between">
                <div>
                  {openDeal.cars?.regnummer && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded mr-2" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                      {openDeal.cars.regnummer}
                    </span>
                  )}
                  <span className="text-[15px] font-medium" style={{ color: '#1C1C1A' }}>
                    {openDeal.cars ? `${openDeal.cars.marke} ${openDeal.cars.modell} ${openDeal.cars.ar}` : 'Okänd bil'}
                  </span>
                </div>
                <button onClick={() => setOpenDeal(null)} className="p-1.5 rounded-lg" style={{ color: '#6E6D68', border: '1px solid #E5E4E0' }}>✕</button>
              </div>
              <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full mt-1" style={{ ...(STATUS_STYLE[openDeal.status] ?? STATUS_STYLE.draft), borderRadius: 100 }}>
                {STATUS_LABELS[openDeal.status] ?? openDeal.status}
              </span>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                <div>
                  <p className="text-[11px]" style={{ color: '#6E6D68' }}>Kund</p>
                  <p className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{openDeal.customers?.namn ?? '—'}</p>
                </div>
                {['reserved', 'handed_over'].includes(openDeal.status) && openDeal.customers?.telefon && (
                  <div>
                    <p className="text-[11px]" style={{ color: '#6E6D68' }}>Telefon</p>
                    <a href={`tel:${openDeal.customers.telefon}`} className="text-[13px] font-medium" style={{ color: '#0F6E56' }}>{openDeal.customers.telefon}</a>
                  </div>
                )}
                <div>
                  <p className="text-[11px]" style={{ color: '#6E6D68' }}>Typ</p>
                  <p className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{TYPE_LABELS[openDeal.deal_type] ?? openDeal.deal_type}</p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: '#6E6D68' }}>Senaste händelse</p>
                  <p className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>{new Date(openDeal.updated_at).toLocaleDateString('sv-SE')}</p>
                </div>
              </div>

              {/* Mark delivered */}
              {['reserved', 'deposit_paid'].includes(openDeal.status) && (
                <div>
                  {!confirmDeliver ? (
                    <button
                      onClick={() => setConfirmDeliver(true)}
                      className="w-full h-10 rounded-lg text-[13px] font-medium"
                      style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                      Markera som levererad
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[13px] font-medium text-center" style={{ color: '#1C1C1A' }}>Bilen är överlämnad till kund?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDeliver(false)} className="flex-1 h-9 rounded-lg text-[13px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>Avbryt</button>
                        <button onClick={() => markDelivered(openDeal)} disabled={markingDelivered}
                          className="flex-1 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center"
                          style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                          {markingDelivered ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Bekräfta leverans'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {openDeal.status === 'handed_over' && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: '#E1F5EE', color: '#085041' }}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-[13px]">Levererad – avräkning genererad</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeliver && !openDeal && <div />}
    </DealerPortalShell>
  );
}
