import DealerShell from '../components/DealerShell';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

export default function DealerLeadsPage({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  function navigate(path: string) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <DealerShell activePage="leads" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-5xl mx-auto">
        {/* Empty state */}
        <div
          className="text-center py-16 px-6 rounded-2xl"
          style={{ background: 'white', border: '1px solid #E8ECF3' }}
        >
          <h1
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
          >
            INGA LEADS ÄN
          </h1>
          <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif, system-ui' }} className="text-sm mb-8">
            Leads från bilköpare syns här när din kampanj fått klick.
          </p>
          <button
            onClick={() => navigate('/handlare/ny')}
            className="px-6 h-11 rounded-full font-bold text-sm transition-all"
            style={{ background: '#FFD500', color: '#0E1B33', fontFamily: '"Signika", ui-sans-serif' }}
          >
            Börja med en kampanj
          </button>
        </div>

        {/* Table header (empty) */}
        <div className="mt-8 bg-white rounded-xl border border-[#E8ECF3] overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-[#E8ECF3]">
            <div style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '13px', fontWeight: 600 }}>
              Namn
            </div>
            <div style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '13px', fontWeight: 600 }}>
              Bil
            </div>
            <div style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '13px', fontWeight: 600 }}>
              Meddelande
            </div>
            <div style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '13px', fontWeight: 600 }}>
              Datum
            </div>
          </div>
          <div className="px-6 py-12 text-center">
            <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', fontSize: '13px' }}>
              Inga leads än
            </p>
          </div>
        </div>
      </div>
    </DealerShell>
  );
}
