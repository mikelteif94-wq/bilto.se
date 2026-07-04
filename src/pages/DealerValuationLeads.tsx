import DealerShell from '../components/DealerShell';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

export default function DealerValuationLeads({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  return (
    <DealerShell activePage="vardering-leads" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-4xl mx-auto">
        {/* Empty state card */}
        <div
          className="text-center py-16 px-6 rounded-2xl"
          style={{ background: 'white', border: '1px solid #E8ECF3' }}
        >
          <h1
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
          >
            VÄRDERA & VINN
          </h1>

          <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }} className="text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Privatpersoner som vill värdera sin bil mot handlare. Deras kontaktuppgifter visas när du accepterar ett intresse.
          </p>

          {/* Pulsing green dot indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-3 h-3">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: '#00A85A', opacity: 0.7 }}
              />
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ background: '#00A85A' }}
              />
            </div>
          </div>

          {/* Inga värderingsintresse text */}
          <div
            className="inline-block px-6 py-4 rounded-xl"
            style={{ background: 'rgba(0,168,90,0.05)', border: '1px solid rgba(0,168,90,0.2)' }}
          >
            <p style={{ color: '#00A85A', fontFamily: '"Signika", ui-sans-serif', fontSize: '14px', fontWeight: 600 }}>
              Inga värderingsintresse just nu
            </p>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 p-6 rounded-xl bg-white border border-[#E8ECF3]">
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
          >
            SÅ FUNGERAR VÄRDERA & VINN
          </h2>
          <ol style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '14px' }} className="space-y-2 ml-4 list-decimal">
            <li>Privatpersoner söker efter handlare att värdera sin bil</li>
            <li>Du får ett intresse och kan acceptera eller avslå</li>
            <li>Accepterade intresse visar kontaktuppgifter direkt</li>
            <li>Du kontaktar kunden och utför värderingen</li>
            <li>Eventuell försäljning registreras i systemet</li>
          </ol>
        </div>
      </div>
    </DealerShell>
  );
}
