import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import DealerPortalShell from '../components/DealerPortalShell';
import { supabase } from '../lib/supabase';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface Settlement {
  id: string;
  deal_id: string;
  deal_type: string;
  status: string;
  base_commission: number;
  kickback_total: number;
  reservation_fee_share: number;
  total: number;
  created_at: string;
  paid_at: string | null;
  deals: {
    deal_number: string | null;
    cars: { marke: string; modell: string; ar: number; regnummer: string | null } | null;
    deal_lines: { negotiated_price: number; line_type: string }[];
  } | null;
}

function fmtKr(v: number) {
  return v.toLocaleString('sv-SE') + ' kr';
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FAEEDA', text: '#854F0B' },
  earned:  { bg: '#E6F1FB', text: '#0C447C' },
  paid:    { bg: '#E1F5EE', text: '#085041' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Väntande', earned: 'Intjänad', paid: 'Utbetald',
};

const TYPE_LABELS: Record<string, string> = {
  kop: 'Köp', inkop: 'Inköp', byte: 'Byte',
};

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

export default function DealerEkonomi({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [month] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('staff_commissions')
        .select(`
          id, deal_id, deal_type, status, base_commission,
          kickback_total, reservation_fee_share, total, created_at, paid_at,
          deals(deal_number, cars(marke, modell, ar, regnummer), deal_lines(negotiated_price, line_type))
        `)
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });
      setSettlements((data ?? []) as unknown as Settlement[]);
      setLoading(false);
    })();
  }, [dealerId]);

  const thisMonth = settlements.filter(s => s.created_at.startsWith(month));
  const totalThisMonth = thisMonth.reduce((sum, s) => sum + s.total, 0);
  const pendingTotal = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.total, 0);

  return (
    <DealerPortalShell activePage="ekonomi" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div>
        <div className="mb-5">
          <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Ekonomi</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>Netto & avräkningar</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Affärer denna månad', value: thisMonth.length + ' st' },
            { label: 'Netto denna månad', value: fmtKr(totalThisMonth) },
            { label: 'Väntande avräkningar', value: fmtKr(pendingTotal) },
          ].map(kpi => (
            <div key={kpi.label} className="p-4" style={cardStyle}>
              <p className="text-[11px] mb-1" style={{ color: '#6E6D68' }}>{kpi.label}</p>
              <p className="text-[18px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-16 text-center" style={cardStyle}>
            <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: '#6E6D68' }} />
            <p className="text-[13px]" style={{ color: '#6E6D68' }}>Inga avräkningar ännu.</p>
          </div>
        ) : (
          <div style={cardStyle}>
            {/* Header */}
            <div className="hidden md:grid px-5 py-2.5 text-[11px] font-medium" style={{ borderBottom: '1px solid #E5E4E0', color: '#6E6D68', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span>Affär</span>
              <span>Typ</span>
              <span>Provision</span>
              <span>Kickback</span>
              <span>Netto till er</span>
              <span>Status</span>
            </div>
            {settlements.map((s, idx) => {
              const car = s.deals?.cars;
              const ss = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending;
              return (
                <div key={s.id} className="grid px-5 py-3.5 items-center gap-4"
                  style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                  <div>
                    {car?.regnummer && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded mr-1.5 inline-block" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                        {car.regnummer}
                      </span>
                    )}
                    <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>
                      {car ? `${car.marke} ${car.modell}` : s.deals?.deal_number ?? '—'}
                    </span>
                    <p className="text-[11px]" style={{ color: '#6E6D68' }}>{new Date(s.created_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <span className="text-[12px]" style={{ color: '#6E6D68' }}>{TYPE_LABELS[s.deal_type] ?? s.deal_type}</span>
                  <span className="text-[13px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(s.base_commission)}</span>
                  <span className="text-[13px]" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(s.kickback_total)}</span>
                  <span className="text-[13px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(s.total)}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block" style={{ ...ss, borderRadius: 100 }}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DealerPortalShell>
  );
}
