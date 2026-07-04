import { useEffect, useState, useMemo } from 'react';
import { Search, AlertTriangle, Loader2, Zap } from 'lucide-react';
import StaffShell from '../components/StaffShell';
import DealWizardModal, { type WizardCar } from '../components/DealWizardModal';
import type { StaffUser } from '../hooks/useStaffAuth';
import { supabase } from '../lib/supabase';

interface StaffPoolProps {
  staffUser: StaffUser;
  onLoggedOut: () => void;
  onDealCreated: (dealId: string) => void;
}

interface PoolCar extends WizardCar {
  miltal: number | null;
  pool_dagar_i_lager: number | null;
  pool_prioritet: string | null;
  pool_status: string | null;
  drivmedel: string | null;
}

type SortKey = 'rabatt' | 'lagertid' | 'prioritet' | 'pris';

function kr(v: number | null) {
  if (v == null) return '—';
  return v.toLocaleString('sv-SE') + ' kr';
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2 };

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: '#E1F5EE', text: '#085041', label: 'Tillgänglig' },
  reserved:  { bg: '#E6F1FB', text: '#0C447C', label: 'Reserverad' },
  sold:      { bg: '#F7F6F3', text: '#6E6D68', label: 'Såld' },
};

const PRIO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: '#FCEBEB', text: '#791F1F', label: 'Akut' },
  high:   { bg: '#FAEEDA', text: '#854F0B', label: 'Prioriterad' },
};

export default function StaffPool({ staffUser, onLoggedOut, onDealCreated }: StaffPoolProps) {
  const [cars, setCars] = useState<PoolCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('prioritet');
  const [filterDealer, setFilterDealer] = useState('');
  const [showLocked, setShowLocked] = useState(false);
  const [wizardCar, setWizardCar] = useState<PoolCar | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cars')
        .select(`
          id, regnummer, marke, modell, ar, miltal, startbud,
          pool_prisgolv, pool_rabattutrymme_kr, pool_dagar_i_lager,
          pool_prioritet, pool_status, drivmedel, dealer_id,
          dealers(id, foretagsnamn)
        `)
        .eq('available_for_staff_sales', true)
        .order('created_at', { ascending: false });
      setCars((data ?? []) as unknown as PoolCar[]);
      setLoading(false);
    })();
  }, []);

  const dealers = useMemo(() => {
    const map = new Map<string, string>();
    cars.forEach(c => { if (c.dealers) map.set(c.dealers.id, c.dealers.foretagsnamn); });
    return Array.from(map.entries());
  }, [cars]);

  const filtered = useMemo(() => {
    let list = [...cars];
    if (!showLocked) list = list.filter(c => !c.pool_status || c.pool_status === 'available');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.marke.toLowerCase().includes(q) || c.modell.toLowerCase().includes(q) ||
        (c.regnummer ?? '').toLowerCase().includes(q) ||
        (c.dealers?.foretagsnamn ?? '').toLowerCase().includes(q)
      );
    }
    if (filterDealer) list = list.filter(c => c.dealers?.id === filterDealer);
    list.sort((a, b) => {
      if (sortKey === 'rabatt') return (b.pool_rabattutrymme_kr ?? 0) - (a.pool_rabattutrymme_kr ?? 0);
      if (sortKey === 'lagertid') return (b.pool_dagar_i_lager ?? 0) - (a.pool_dagar_i_lager ?? 0);
      if (sortKey === 'prioritet') return (PRIORITY_ORDER[a.pool_prioritet ?? 'normal'] ?? 2) - (PRIORITY_ORDER[b.pool_prioritet ?? 'normal'] ?? 2);
      if (sortKey === 'pris') return (a.startbud ?? 0) - (b.startbud ?? 0);
      return 0;
    });
    return list;
  }, [cars, search, filterDealer, sortKey, showLocked]);

  const lockedCount = cars.filter(c => c.pool_status && c.pool_status !== 'available').length;

  const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

  return (
    <StaffShell activePage="pool" staffUser={staffUser} onLoggedOut={onLoggedOut}>
      <div>
        <div className="mb-5">
          <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Handlarpool</h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>
            {loading ? '…' : `${filtered.length} bilar från ${dealers.length} handlare`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6E6D68' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök märke, modell, regnummer…"
              className="w-full h-9 pl-8 pr-3 rounded-lg text-[14px] focus:outline-none"
              style={{ border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A' }}
            />
          </div>

          {dealers.length > 1 && (
            <select
              value={filterDealer}
              onChange={e => setFilterDealer(e.target.value)}
              className="h-9 pl-3 pr-7 rounded-lg text-[13px] focus:outline-none"
              style={{ border: '1px solid #E5E4E0', background: '#FFFFFF', color: '#1C1C1A' }}
            >
              <option value="">Alla handlare</option>
              {dealers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}

          <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ border: '1px solid #E5E4E0', background: '#FFFFFF' }}>
            {([
              ['rabatt', 'Mest rabatt'],
              ['lagertid', 'Längst tid'],
              ['prioritet', 'Prioritet'],
              ['pris', 'Lägst pris'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className="px-3 h-7 rounded-md text-[12px] transition"
                style={{
                  background: sortKey === key ? '#0F6E56' : 'transparent',
                  color: sortKey === key ? '#FFFFFF' : '#6E6D68',
                  fontWeight: sortKey === key ? 500 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-[13px] cursor-pointer" style={{ color: '#6E6D68' }}>
            <input type="checkbox" checked={showLocked} onChange={e => setShowLocked(e.target.checked)} className="rounded" style={{ accentColor: '#0F6E56' }} />
            Visa låsta{lockedCount > 0 ? ` (${lockedCount})` : ''}
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={cardStyle}>
            <p className="text-[14px]" style={{ color: '#6E6D68' }}>Inga bilar matchar din sökning.</p>
          </div>
        ) : (
          <div style={cardStyle}>
            {/* Table header */}
            <div className="hidden lg:grid px-4 py-2.5 border-b" style={{ borderColor: '#E5E4E0', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.6fr 0.7fr 0.8fr auto' }}>
              {['Bil', 'Handlare', 'Utpris', 'Golv (intern)', 'Utrymme', 'Dagar', 'Prio', 'Status', ''].map(h => (
                <div key={h} className="text-[11px] font-medium" style={{ color: '#6E6D68' }}>{h}</div>
              ))}
            </div>

            {filtered.map((car, idx) => {
              const statusKey = car.pool_status ?? 'available';
              const statusStyle = STATUS_STYLE[statusKey] ?? STATUS_STYLE.available;
              const prioStyle = car.pool_prioritet && PRIO_STYLE[car.pool_prioritet];
              const rabatt = car.pool_rabattutrymme_kr ?? 0;
              const lagertid = car.pool_dagar_i_lager;
              const isLocked = statusKey !== 'available';

              return (
                <div
                  key={car.id}
                  className="px-4 py-3 flex flex-wrap items-center gap-3 lg:grid lg:gap-0"
                  style={{
                    borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined,
                    gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 0.6fr 0.7fr 0.8fr auto',
                    opacity: isLocked ? 0.55 : 1,
                  }}
                >
                  {/* Bil */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-8 rounded-md shrink-0 flex items-center justify-center text-[10px] font-medium" style={{ background: '#F7F6F3', color: '#6E6D68' }}>
                      {car.marke.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate" style={{ color: '#1C1C1A' }}>
                        {car.marke} {car.modell} {car.ar}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {car.regnummer && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                            {car.regnummer}
                          </span>
                        )}
                        {car.miltal != null && (
                          <span className="text-[12px]" style={{ color: '#6E6D68' }}>{car.miltal.toLocaleString('sv-SE')} mil</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Handlare */}
                  <div className="text-[13px] truncate pr-2" style={{ color: '#6E6D68' }}>{car.dealers?.foretagsnamn ?? '—'}</div>

                  {/* Utpris */}
                  <div className="text-[13px] font-medium" style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{kr(car.startbud)}</div>

                  {/* Golv */}
                  <div className="text-[13px]" style={{ color: '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>{kr(car.pool_prisgolv)}</div>

                  {/* Utrymme */}
                  <div>
                    {rabatt > 0 ? (
                      <span className="text-[13px] font-medium" style={{ color: '#0F6E56', fontFamily: 'JetBrains Mono, monospace' }}>
                        {kr(rabatt)}
                      </span>
                    ) : <span className="text-[13px]" style={{ color: '#6E6D68' }}>—</span>}
                  </div>

                  {/* Dagar */}
                  <div>
                    {lagertid != null ? (
                      <span className="text-[13px] font-medium flex items-center gap-1"
                        style={{ color: lagertid > 90 ? '#791F1F' : lagertid > 45 ? '#854F0B' : '#6E6D68', fontFamily: 'JetBrains Mono, monospace' }}>
                        {lagertid}
                        {lagertid > 90 && <AlertTriangle className="w-3 h-3" />}
                      </span>
                    ) : <span className="text-[13px]" style={{ color: '#6E6D68' }}>—</span>}
                  </div>

                  {/* Prio */}
                  <div>
                    {prioStyle && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: prioStyle.bg, color: prioStyle.text, borderRadius: 100 }}>
                        {prioStyle.label}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: 100 }}>
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => !isLocked && setWizardCar(car)}
                      disabled={isLocked}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-medium transition"
                      style={{ background: isLocked ? '#F7F6F3' : '#0F6E56', color: isLocked ? '#6E6D68' : '#FFFFFF', border: isLocked ? '1px solid #E5E4E0' : 'none' }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Bygg affär
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {wizardCar && (
        <DealWizardModal
          car={wizardCar}
          staffUser={staffUser}
          onClose={() => setWizardCar(null)}
          onCreated={(id) => { setWizardCar(null); onDealCreated(id); }}
        />
      )}
    </StaffShell>
  );
}
