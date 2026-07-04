import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import StaffShell from '../components/StaffShell';
import { supabase } from '../lib/supabase';
import type { StaffUser } from '../hooks/useStaffAuth';

interface Props {
  staffUser: StaffUser;
  onLoggedOut: () => void;
}

interface Earning {
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

export default function StaffEarnings({ staffUser, onLoggedOut }: Props) {
  const [earnings, setEarnings] = useState<Earning[]>([]);
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
          id, deal_id, deal_type, status,
          base_commission, kickback_total, reservation_fee_share, total,
          created_at, paid_at,
          deals(deal_number, cars(marke, modell, ar, regnummer))
        `)
        .eq('staff_user_id', staffUser.id)
        .order('created_at', { ascending: false });
      setEarnings((data ?? []) as unknown as Earning[]);
      setLoading(false);
    })();
  }, [staffUser.id]);

  const thisMonth = earnings.filter(e => e.created_at.startsWith(month));
  const totalThisMonth = thisMonth.reduce((s, e) => s + e.total, 0);
  const totalPaid = earnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.total, 0);
  const pendingTotal = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + e.total, 0);

  return (
    <StaffShell staffUser={staffUser} activePage="intjaning" onLoggedOut={onLoggedOut}>
      <div className="max-w-4xl">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-slate-900">Min intjäning</h1>
          <p className="text-sm text-slate-500 mt-0.5">Provision & avräkningar</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Affärer denna månad', value: thisMonth.length + ' st' },
            { label: 'Netto denna månad',   value: fmtKr(totalThisMonth) },
            { label: 'Väntande',            value: fmtKr(pendingTotal) },
            { label: 'Totalt utbetalt',     value: fmtKr(totalPaid) },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[11px] text-slate-500 mb-1">{kpi.label}</p>
              <p className="text-[17px] font-semibold text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : earnings.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">Inga avräkningar ännu.</p>
            <p className="text-xs text-slate-400 mt-1">Avräkningar genereras när en affär levereras.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid px-5 py-2.5 text-[11px] font-medium text-slate-400 border-b border-slate-100"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
              <span>Affär</span>
              <span>Typ</span>
              <span>Provision</span>
              <span>Kickback</span>
              <span>Totalt</span>
              <span>Status</span>
            </div>

            {earnings.map((e, idx) => {
              const car = e.deals?.cars;
              const ss = STATUS_STYLE[e.status] ?? STATUS_STYLE.pending;
              return (
                <div key={e.id}
                  className="grid px-5 py-3.5 items-center gap-4"
                  style={{ borderTop: idx > 0 ? '1px solid #f1f0ed' : undefined, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                  <div>
                    {car?.regnummer && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded mr-1.5 inline-block"
                        style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                        {car.regnummer}
                      </span>
                    )}
                    <span className="text-[13px] font-medium text-slate-900">
                      {car ? `${car.marke} ${car.modell}` : e.deals?.deal_number ?? '—'}
                    </span>
                    <p className="text-[11px] text-slate-400">{new Date(e.created_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <span className="text-[12px] text-slate-500">{TYPE_LABELS[e.deal_type] ?? e.deal_type}</span>
                  <span className="text-[13px] font-medium text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(e.base_commission)}</span>
                  <span className="text-[13px] text-slate-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(e.kickback_total)}</span>
                  <span className="text-[13px] font-semibold text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(e.total)}</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block" style={{ ...ss, borderRadius: 100 }}>
                    {STATUS_LABELS[e.status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffShell>
  );
}
