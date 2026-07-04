import { useEffect, useState } from 'react';
import { Loader2, Plus, Check } from 'lucide-react';
import DealerPortalShell from '../components/DealerPortalShell';
import { supabase } from '../lib/supabase';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface Car {
  id: string;
  regnummer: string | null;
  marke: string;
  modell: string;
  ar: number;
  miltal: number | null;
  pool_utpris: number | null;
  pool_prisgolv: number | null;
  pool_prioritet: string | null;
  pool_status: string | null;
  pool_added_at: string | null;
  created_at: string;
  available_for_staff_sales: boolean;
}

const PRIORITET_LABELS: Record<string, string> = {
  normal: 'Normal', prioriterad: 'Prioriterad', akut: 'Akut',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Tillgänglig', reserved: 'Reserverad', sold: 'Såld', paused: 'Pausad',
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  available: { bg: '#E1F5EE', text: '#085041' },
  reserved:  { bg: '#FAEEDA', text: '#854F0B' },
  sold:      { bg: '#F7F6F3', text: '#6E6D68' },
  paused:    { bg: '#F7F6F3', text: '#6E6D68' },
};

function daysInStock(car: Car) {
  const d = new Date(car.pool_added_at ?? car.created_at).getTime();
  return Math.floor((Date.now() - d) / 86400000);
}

const cardStyle = { background: '#FFFFFF', border: '1px solid #E5E4E0', borderRadius: 12 };

export default function DealerMittLager({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cars')
        .select('id, regnummer, marke, modell, ar, miltal, pool_utpris, pool_prisgolv, pool_prioritet, pool_status, pool_added_at, created_at, available_for_staff_sales')
        .eq('dealer_id', dealerId)
        .eq('available_for_staff_sales', true)
        .order('created_at', { ascending: false });
      setCars((data ?? []) as Car[]);
      setLoading(false);
    })();
  }, [dealerId]);

  async function updateCar(id: string, field: string, value: string | number | null) {
    setSaving(id + field);
    await supabase.from('cars').update({ [field]: value }).eq('id', id);
    setCars(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    setSaving(null);
    setSaved(id + field);
    setTimeout(() => setSaved(null), 1500);
  }

  return (
    <DealerPortalShell activePage="mitt-lager" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: '#1C1C1A' }}>Mitt lager</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#6E6D68' }}>{cars.length} bilar i lager</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[13px] font-medium" style={{ background: '#0F6E56', color: '#FFFFFF' }}>
            <Plus className="w-3.5 h-3.5" />
            Lägg till bil
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-16 text-[13px]" style={{ color: '#6E6D68' }}>
            Inga bilar i lagret. Lägg till din första bil.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={cardStyle}>
              {/* Header */}
              <div className="grid gap-4 px-4 py-2.5 text-[11px] font-medium hidden md:grid"
                style={{ borderBottom: '1px solid #E5E4E0', color: '#6E6D68', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                <span>Bil</span>
                <span>Utpris</span>
                <span>Prisgolv</span>
                <span>Prioritet</span>
                <span>Dagar</span>
                <span>Status</span>
              </div>

              {cars.map((car, idx) => {
                const days = daysInStock(car);
                const statusStyle = STATUS_STYLE[car.pool_status ?? 'available'] ?? STATUS_STYLE.available;
                return (
                  <div key={car.id} className="px-4 py-3 grid gap-4 items-center"
                    style={{ borderTop: idx > 0 ? '1px solid #E5E4E0' : undefined, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                    {/* Bil */}
                    <div>
                      {car.regnummer && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded mr-1.5 inline-block" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                          {car.regnummer}
                        </span>
                      )}
                      <span className="text-[13px] font-medium" style={{ color: '#1C1C1A' }}>
                        {car.marke} {car.modell} {car.ar}
                      </span>
                      {car.miltal != null && (
                        <p className="text-[11px]" style={{ color: '#6E6D68' }}>{car.miltal.toLocaleString('sv-SE')} mil</p>
                      )}
                    </div>

                    {/* Utpris - editable */}
                    <div className="relative">
                      <input
                        type="number"
                        defaultValue={car.pool_utpris ?? ''}
                        onBlur={e => {
                          const v = parseInt(e.target.value, 10) || null;
                          if (v !== car.pool_utpris) updateCar(car.id, 'pool_utpris', v);
                        }}
                        className="w-full h-8 px-2 text-[13px] focus:outline-none rounded-lg text-right"
                        style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
                      />
                      {saved === car.id + 'pool_utpris' && (
                        <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#0F6E56' }} />
                      )}
                    </div>

                    {/* Prisgolv - editable */}
                    <div className="relative">
                      <input
                        type="number"
                        defaultValue={car.pool_prisgolv ?? ''}
                        onBlur={e => {
                          const v = parseInt(e.target.value, 10) || null;
                          if (v !== car.pool_prisgolv) updateCar(car.id, 'pool_prisgolv', v);
                        }}
                        className="w-full h-8 px-2 text-[13px] focus:outline-none rounded-lg text-right"
                        style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
                      />
                    </div>

                    {/* Prioritet - dropdown */}
                    <select
                      value={car.pool_prioritet ?? 'normal'}
                      onChange={e => updateCar(car.id, 'pool_prioritet', e.target.value)}
                      className="h-8 px-2 text-[13px] focus:outline-none rounded-lg w-full"
                      style={{ border: '1px solid #E5E4E0', background: '#F7F6F3', color: '#1C1C1A' }}
                    >
                      {Object.entries(PRIORITET_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>

                    {/* Dagar */}
                    <div>
                      <span
                        className="text-[12px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: days > 90 ? '#FCEBEB' : '#F7F6F3', color: days > 90 ? '#791F1F' : '#6E6D68', borderRadius: 100 }}>
                        {days} dagar
                      </span>
                    </div>

                    {/* Status */}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block" style={{ ...statusStyle, borderRadius: 100 }}>
                      {STATUS_LABELS[car.pool_status ?? 'available']}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DealerPortalShell>
  );
}
