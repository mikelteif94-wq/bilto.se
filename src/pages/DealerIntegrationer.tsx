import { Lock } from 'lucide-react';
import DealerShell from '../components/DealerShell';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

export default function DealerIntegrationer({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const features = [
    'POST /campaigns API',
    'Webhook för leads',
    'Statistik-endpoint',
  ];

  return (
    <DealerShell activePage="integrationer" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
        >
          INTEGRATIONER
        </h1>
        <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', marginBottom: '2rem' }} className="text-sm">
          Anslut Bilspara med ditt CRM eller DMS.
        </p>

        {/* Coming soon card */}
        <div
          className="p-8 rounded-2xl"
          style={{ background: 'white', border: '1px solid #E8ECF3' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
            >
              API-nycklar och webhooks
            </h2>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase"
              style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
            >
              KOMMER SNART
            </span>
          </div>

          <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', marginBottom: '1.5rem' }} className="text-sm">
            API-nycklar och webhooks för att integrera Bilspara med ditt CRM eller DMS.
          </p>

          {/* Features list */}
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#E8ECF3' }}>
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <Lock className="w-4 h-4" style={{ color: '#6B7486' }} />
                <span style={{ color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif', fontSize: '14px' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', marginTop: '2rem' }} className="text-xs text-center">
          Vi arbetar på att göra det här möjligt. Fler detaljer kommer snart.
        </p>
      </div>
    </DealerShell>
  );
}
