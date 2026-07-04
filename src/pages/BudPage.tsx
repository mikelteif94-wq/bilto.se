import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  token: string;
}

interface BidData {
  id: string;
  regnummer: string | null;
  marke: string | null;
  modell: string | null;
  ar: number | null;
  bid_amount: number | null;
  valid_until: string | null;
  status: string;
  customers: { namn: string } | null;
}

export default function BudPage({ token }: Props) {
  const [bid, setBid] = useState<BidData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [responding, setResponding] = useState(false);
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null);
  const [confirmModal, setConfirmModal] = useState<'accept' | 'reject' | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('valuations')
        .select('id, regnummer, marke, modell, ar, bid_amount, valid_until, status, customers(namn)')
        .eq('bid_token', token)
        .maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setBid(data as unknown as BidData);
      setLoading(false);
    })();
  }, [token]);

  const expired = bid?.valid_until ? new Date(bid.valid_until) < new Date() : false;
  const alreadyAnswered = bid && ['accepted', 'rejected'].includes(bid.status);

  async function respond(decision: 'accepted' | 'rejected') {
    if (!bid) return;
    setResponding(true);
    await supabase.from('valuations').update({
      status: decision,
      response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', bid.id);
    setDone(decision);
    setConfirmModal(null);
    setResponding(false);
  }

  function fmtKr(v: number | null) {
    if (v == null) return '—';
    return v.toLocaleString('sv-SE') + ' kr';
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#F7F6F3', fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0F6E56' }}>
            <span className="text-white text-[12px] font-bold">B</span>
          </div>
          <span className="text-[18px] font-medium" style={{ color: '#1C1C1A' }}>Bytesmotorn</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6E6D68' }} />
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
            <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: '#6E6D68' }} />
            <h1 className="text-[18px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Länken är inte giltig</h1>
            <p className="text-[14px]" style={{ color: '#6E6D68' }}>Kontrollera att du har rätt länk, eller kontakta oss.</p>
            <p className="text-[13px] mt-3" style={{ color: '#6E6D68' }}>Tel: <a href="tel:+46700000000" className="font-medium" style={{ color: '#0F6E56' }}>070-000 00 00</a></p>
          </div>
        )}

        {!loading && bid && !notFound && (
          <>
            {/* Already answered */}
            {(done === 'accepted' || alreadyAnswered && bid.status === 'accepted') && (
              <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#0F6E56' }} />
                <h1 className="text-[22px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Tack!</h1>
                <p className="text-[15px]" style={{ color: '#6E6D68' }}>
                  Du har accepterat budet. Vi hör av oss inom kort för att boka in nästa steg.
                </p>
              </div>
            )}

            {(done === 'rejected' || alreadyAnswered && bid.status === 'rejected') && (
              <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                <XCircle className="w-10 h-10 mx-auto mb-4" style={{ color: '#6E6D68' }} />
                <h1 className="text-[20px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Tack för svaret</h1>
                <p className="text-[14px]" style={{ color: '#6E6D68' }}>Vi respekterar ditt beslut. Hör av dig om du ändrar dig.</p>
                <p className="text-[13px] mt-3" style={{ color: '#6E6D68' }}>Tel: <a href="tel:+46700000000" className="font-medium" style={{ color: '#0F6E56' }}>070-000 00 00</a></p>
              </div>
            )}

            {/* Expired */}
            {!done && !alreadyAnswered && expired && (
              <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                <Clock className="w-10 h-10 mx-auto mb-4" style={{ color: '#854F0B' }} />
                <h1 className="text-[20px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Budet har tyvärr gått ut</h1>
                <p className="text-[14px]" style={{ color: '#6E6D68' }}>Budet gällde till {fmtDate(bid.valid_until!)}.</p>
                <p className="text-[14px] mt-2" style={{ color: '#6E6D68' }}>Ring oss på <a href="tel:+46700000000" className="font-medium" style={{ color: '#0F6E56' }}>070-000 00 00</a></p>
              </div>
            )}

            {/* Active bid */}
            {!done && !alreadyAnswered && !expired && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                <div className="px-6 pt-6 pb-4">
                  <p className="text-[13px] mb-1" style={{ color: '#6E6D68' }}>
                    {bid.customers?.namn ? `Hej ${bid.customers.namn.split(' ')[0]}!` : 'Hej!'}
                  </p>
                  <h1 className="text-[22px] font-medium mb-1" style={{ color: '#1C1C1A' }}>
                    {bid.regnummer && (
                      <span className="text-[14px] font-medium mr-2 px-2 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>{bid.regnummer}</span>
                    )}
                    {bid.marke} {bid.modell} {bid.ar}
                  </h1>
                  <p className="text-[14px]" style={{ color: '#6E6D68' }}>Vi kan erbjuda</p>
                </div>

                {/* Bid amount */}
                <div className="mx-6 mb-5 px-5 py-5 rounded-xl text-center" style={{ background: '#E6F1FB' }}>
                  <div className="text-[42px] font-medium" style={{ color: '#0C447C', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.1 }}>
                    {fmtKr(bid.bid_amount)}
                  </div>
                  <p className="text-[13px] mt-1" style={{ color: '#0C447C' }}>för din bil</p>
                </div>

                {bid.valid_until && (
                  <div className="mx-6 mb-5 flex items-center gap-2 text-[13px]" style={{ color: '#854F0B' }}>
                    <Clock className="w-4 h-4 shrink-0" />
                    Budet gäller till {fmtDate(bid.valid_until)}
                  </div>
                )}

                <div className="px-6 pb-6 flex flex-col gap-3">
                  <button
                    onClick={() => setConfirmModal('accept')}
                    className="w-full h-12 rounded-xl text-[15px] font-medium"
                    style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                    Acceptera budet
                  </button>
                  <button
                    onClick={() => setConfirmModal('reject')}
                    className="w-full h-12 rounded-xl text-[15px]"
                    style={{ border: '1px solid #E5E4E0', color: '#6E6D68', background: '#FFFFFF' }}>
                    Tacka nej
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm modals */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#FFFFFF' }}>
            {confirmModal === 'accept' ? (
              <>
                <CheckCircle2 className="w-10 h-10 mb-3" style={{ color: '#0F6E56' }} />
                <h2 className="text-[18px] font-medium mb-1" style={{ color: '#1C1C1A' }}>Acceptera budet?</h2>
                <p className="text-[14px] mb-5" style={{ color: '#6E6D68' }}>Du accepterar {fmtKr(bid?.bid_amount)} för din {bid?.marke} {bid?.modell}.</p>
              </>
            ) : (
              <>
                <XCircle className="w-10 h-10 mb-3" style={{ color: '#6E6D68' }} />
                <h2 className="text-[18px] font-medium mb-1" style={{ color: '#1C1C1A' }}>Tacka nej?</h2>
                <p className="text-[14px] mb-5" style={{ color: '#6E6D68' }}>Budet upphör och vi noteras att du tackat nej.</p>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 h-11 rounded-xl text-[14px]" style={{ border: '1px solid #E5E4E0', color: '#6E6D68' }}>
                Avbryt
              </button>
              <button onClick={() => respond(confirmModal)}
                disabled={responding}
                className="flex-1 h-11 rounded-xl text-[14px] font-medium flex items-center justify-center"
                style={{ background: confirmModal === 'accept' ? '#0F6E56' : '#1C1C1A', color: '#FFFFFF' }}>
                {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmModal === 'accept' ? 'Bekräfta' : 'Tacka nej'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
