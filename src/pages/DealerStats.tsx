import DealerShell from '../components/DealerShell';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

export default function DealerStats({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const kpis = [
    { label: 'Visningar', value: '–', description: 'Antal gånger din kampanj visats' },
    { label: 'Klick', value: '–', description: 'Antal klick på din kampanj' },
    { label: 'CTR', value: '–', description: 'Klickfrekvens (procent)' },
    { label: 'Konverteringar', value: '–', description: 'Leads från din kampanj' },
  ];

  return (
    <DealerShell activePage="statistik" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
        >
          STATISTIK
        </h1>
        <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', marginBottom: '2rem' }} className="text-sm">
          Statistik uppdateras automatiskt när dina kampanjer fått trafik.
        </p>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="p-5 rounded-xl"
              style={{ background: 'white', border: '1px solid #E8ECF3' }}
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
              >
                {kpi.value}
              </div>
              <div style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '13px' }}>
                {kpi.label}
              </div>
              <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '12px', marginTop: '0.5rem' }}>
                {kpi.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DealerShell>
  );
}
