import { useEffect, useState } from 'react';
import { Plus, Eye, MousePointerClick, Clock, TrendingDown, MoreVertical, Pause, Trash2 } from 'lucide-react';
import DealerShell from '../components/DealerShell';
import { supabase } from '../lib/supabase';

interface DealerDashboardProps {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface Campaign {
  id: string;
  make: string;
  model: string;
  year: number | null;
  image_url: string | null;
  ordinarie_pris: number;
  kampanj_pris: number;
  total_besparing_kr: number;
  status: 'aktiv' | 'pausad' | 'utgangen';
  slutdatum: string;
  sale_type: string;
  visningar: number;
  klick: number;
  created_at: string;
}

function fmt(n: number) {
  return n.toLocaleString('sv-SE');
}

function daysLeft(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

function StatusBadge({ status }: { status: Campaign['status'] }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    aktiv:    { bg: '#00A85A', color: 'white',    label: 'Aktiv' },
    pausad:   { bg: '#FFD500', color: '#0E1B33',  label: 'Pausad' },
    utgangen: { bg: '#E8ECF3', color: '#6B7486',  label: 'Utgången' },
  };
  const s = styles[status] ?? styles.utgangen;
  return (
    <span
      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color, fontFamily: '"Signika", ui-sans-serif' }}
    >
      {s.label}
    </span>
  );
}

export default function DealerDashboard({ dealerId, foretagsnamn, onLoggedOut }: DealerDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('id,make,model,year,image_url,ordinarie_pris,kampanj_pris,total_besparing_kr,status,slutdatum,sale_type,visningar,klick,created_at')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false });
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [dealerId]);

  async function togglePause(c: Campaign) {
    const next = c.status === 'aktiv' ? 'pausad' : 'aktiv';
    await supabase.from('campaigns').update({ status: next }).eq('id', c.id);
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
  }

  async function deleteCampaign(id: string) {
    await supabase.from('campaigns').update({ status: 'utgangen' }).eq('id', id);
    setCampaigns(prev => prev.map(x => x.id === id ? { ...x, status: 'utgangen' } : x));
    setConfirmDelete(null);
  }

  const active = campaigns.filter(c => c.status === 'aktiv');
  const totalSavings = active.reduce((s, c) => s + c.total_besparing_kr, 0);
  const totalViews = campaigns.reduce((s, c) => s + c.visningar, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.klick, 0);

  const kpis = [
    { label: 'Aktiva kampanjer', value: active.length.toString(), icon: TrendingDown, color: '#00A85A' },
    { label: 'Total besparing', value: fmt(totalSavings) + ' kr', icon: TrendingDown, color: '#FFD500' },
    { label: 'Visningar', value: fmt(totalViews), icon: Eye, color: '#0E1B33' },
    { label: 'Klick', value: fmt(totalClicks), icon: MousePointerClick, color: '#E4002B' },
  ];

  return (
    <DealerShell activePage="dashboard" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-[28px] sm:text-[36px] leading-tight"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33', letterSpacing: '-0.01em' }}
          >
            DINA KAMPANJER
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
            {foretagsnamn}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { window.history.pushState({}, '', '/handlare/ny'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-full font-bold text-[14px] transition"
          style={{ background: '#0E1B33', color: '#FFD500', fontFamily: '"Signika", ui-sans-serif' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Ny kampanj
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #E8ECF3', boxShadow: '0 1px 2px rgb(14 27 51 / .04), 0 10px 30px -12px rgb(14 27 51 / .08)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
              {k.label}
            </p>
            <p
              className="text-[22px] sm:text-[26px] leading-none font-bold"
              style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33', letterSpacing: '-0.01em' }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Campaigns list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #E8ECF3' }} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl bg-white text-center"
          style={{ border: '1px solid #E8ECF3' }}
        >
          <p
            className="text-[22px] font-bold mb-2"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
          >
            INGA KAMPANJER ÄN
          </p>
          <p className="text-[14px] mb-6" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
            Skapa din första kampanj och nå tusentals bilköpare.
          </p>
          <button
            type="button"
            onClick={() => { window.history.pushState({}, '', '/handlare/ny'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full font-bold text-[14px]"
            style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Skapa kampanj
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const days = daysLeft(c.slutdatum);
            const savings = c.total_besparing_kr || (c.ordinarie_pris - c.kampanj_pris);
            const pct = Math.round(((c.ordinarie_pris - c.kampanj_pris) / c.ordinarie_pris) * 100);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl flex flex-col sm:flex-row gap-4 p-4 sm:p-5 transition-all"
                style={{ border: '1px solid #E8ECF3', boxShadow: '0 1px 2px rgb(14 27 51 / .04)' }}
              >
                {/* Image */}
                <div
                  className="w-full sm:w-28 h-20 rounded-xl overflow-hidden shrink-0"
                  style={{ background: '#F7F8FB' }}
                >
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TrendingDown className="w-6 h-6" style={{ color: '#6B7486' }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-1">
                    <span
                      className="text-[15px] font-bold"
                      style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
                    >
                      {c.make} {c.model} {c.year ?? ''}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]" style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>
                    <span style={{ color: '#00A85A', fontWeight: 700 }}>Spara {fmt(savings)} kr</span>
                    <span>-{pct}%</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{c.visningar}</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" />{c.klick}</span>
                    {c.status !== 'utgangen' && (
                      <span className="flex items-center gap-1" style={{ color: days <= 3 ? '#E4002B' : '#6B7486' }}>
                        <Clock className="w-3.5 h-3.5" />{days} dagar kvar
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== 'utgangen' && (
                    <button
                      type="button"
                      onClick={() => togglePause(c)}
                      title={c.status === 'aktiv' ? 'Pausa' : 'Aktivera'}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition"
                      style={{ background: '#F7F8FB', border: '1px solid #E8ECF3' }}
                    >
                      <Pause className="w-4 h-4" style={{ color: '#6B7486' }} />
                    </button>
                  )}
                  {confirmDelete === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => deleteCampaign(c.id)}
                        className="px-3 h-8 rounded-full text-[12px] font-bold"
                        style={{ background: '#E4002B', color: 'white' }}
                      >
                        Bekräfta
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 h-8 rounded-full text-[12px] font-semibold"
                        style={{ background: '#F7F8FB', border: '1px solid #E8ECF3', color: '#6B7486' }}
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(c.id)}
                      title="Ta bort"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition"
                      style={{ background: '#F7F8FB', border: '1px solid #E8ECF3' }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#6B7486' }} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition"
                    style={{ background: '#F7F8FB', border: '1px solid #E8ECF3' }}
                  >
                    <MoreVertical className="w-4 h-4" style={{ color: '#6B7486' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DealerShell>
  );
}
