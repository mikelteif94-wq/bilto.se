import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  token: string;
}

interface AvtalData {
  id: string;
  deal_id: string;
  reservation_fee: number;
  avtal_token: string;
  avtal_signed_at: string | null;
  avtal_opened_at: string | null;
  deals: {
    deal_number: string | null;
    customers: { namn: string; telefon: string | null } | null;
    cars: { marke: string; modell: string; ar: number; regnummer: string | null } | null;
    deal_lines: { description: string; negotiated_price: number; line_type: string }[];
  } | null;
}

export default function AvtalPage({ token }: Props) {
  const [avtal, setAvtal] = useState<AvtalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('deal_reservations')
        .select(`
          id, deal_id, reservation_fee, avtal_token, avtal_signed_at, avtal_opened_at,
          deals(deal_number,
            customers(namn, telefon),
            cars(marke, modell, ar, regnummer),
            deal_lines(description, negotiated_price, line_type)
          )
        `)
        .eq('avtal_token', token)
        .maybeSingle();

      if (!data) { setNotFound(true); setLoading(false); return; }
      const d = data as unknown as AvtalData;
      setAvtal(d);
      setSigned(!!d.avtal_signed_at);

      // Mark as opened
      if (!d.avtal_opened_at) {
        await supabase.from('deal_reservations').update({ avtal_opened_at: new Date().toISOString() }).eq('id', d.id);
      }
      setLoading(false);
    })();
  }, [token]);

  async function signBankId() {
    if (!avtal) return;
    setSigning(true);
    // Mock BankID: 2s spinner then success
    await new Promise(r => setTimeout(r, 2000));
    await supabase.from('deal_reservations').update({
      avtal_signed_at: new Date().toISOString(),
      avtal_signed_method: 'bankid',
      updated_at: new Date().toISOString(),
    }).eq('id', avtal.id);
    setSigned(true);
    setSigning(false);
  }

  function fmtKr(v: number) {
    return v.toLocaleString('sv-SE') + ' kr';
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#F7F6F3', fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-lg mx-auto">
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
            <h1 className="text-[18px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Avtalet hittades inte</h1>
            <p className="text-[14px]" style={{ color: '#6E6D68' }}>Kontakta oss om du tror att det är fel.</p>
          </div>
        )}

        {!loading && avtal && (
          <>
            {signed ? (
              <div className="rounded-xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#0F6E56' }} />
                <h1 className="text-[22px] font-medium mb-2" style={{ color: '#1C1C1A' }}>Avtal signerat!</h1>
                <p className="text-[14px]" style={{ color: '#6E6D68' }}>
                  Tack! Vi hör av oss med mer information om leveransen.
                </p>
                {avtal.avtal_signed_at && (
                  <p className="text-[12px] mt-3" style={{ color: '#6E6D68' }}>
                    Signerat: {new Date(avtal.avtal_signed_at).toLocaleString('sv-SE')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header card */}
                <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5" style={{ color: '#0F6E56' }} />
                    <h1 className="text-[18px] font-medium" style={{ color: '#1C1C1A' }}>Reservationsavtal</h1>
                  </div>

                  {avtal.deals?.cars && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        {avtal.deals.cars.regnummer && (
                          <span className="text-[12px] font-medium px-2 py-0.5 rounded" style={{ fontFamily: 'JetBrains Mono, monospace', background: '#E6F1FB', color: '#0C447C', borderRadius: 4 }}>
                            {avtal.deals.cars.regnummer}
                          </span>
                        )}
                        <span className="text-[16px] font-medium" style={{ color: '#1C1C1A' }}>
                          {avtal.deals.cars.marke} {avtal.deals.cars.modell} {avtal.deals.cars.ar}
                        </span>
                      </div>
                      {avtal.deals.customers && (
                        <p className="text-[13px]" style={{ color: '#6E6D68' }}>
                          Kund: {avtal.deals.customers.namn}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Deal lines summary */}
                  {avtal.deals?.deal_lines && avtal.deals.deal_lines.length > 0 && (
                    <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #E5E4E0' }}>
                      {avtal.deals.deal_lines.map((line, i) => (
                        <div key={i} className="flex justify-between px-4 py-2.5 text-[13px]"
                          style={{ borderTop: i > 0 ? '1px solid #F7F6F3' : undefined }}>
                          <span style={{ color: '#1C1C1A' }}>{line.description}</span>
                          <span style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>
                            {line.negotiated_price < 0 ? '−' : ''}{Math.abs(line.negotiated_price).toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between px-4 py-3 text-[13px] font-medium" style={{ borderTop: '1px solid #E5E4E0', background: '#F7F6F3' }}>
                        <span style={{ color: '#1C1C1A' }}>Reservationsavgift</span>
                        <span style={{ color: '#1C1C1A', fontFamily: 'JetBrains Mono, monospace' }}>{fmtKr(avtal.reservation_fee)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms card */}
                <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                  <h2 className="text-[14px] font-medium mb-3" style={{ color: '#1C1C1A' }}>Villkor</h2>
                  <div className="space-y-3 text-[13px]" style={{ color: '#6E6D68' }}>
                    <p><strong style={{ color: '#1C1C1A' }}>Reservationsavgift:</strong> {fmtKr(avtal.reservation_fee)} betalas via Swish och bekräftar din reservation. Avgiften återbetalas inte vid ånger utöver ångerrätten.</p>
                    <p><strong style={{ color: '#1C1C1A' }}>Dokumenterade anmärkningar:</strong> Skicksprotokoll med godkända anmärkningar kan inte reklameras efter avtalets ingående. Du har tagit del av och godkänt bilens skick.</p>
                    <p><strong style={{ color: '#1C1C1A' }}>Ångerrätt:</strong> För avtal ingångna på distans gäller 14 dagars ångerrätt. Bilen ska returneras i oförändrat skick. Reservationsavgiften återbetalas vid utnyttjad ångerrätt.</p>
                    <p><strong style={{ color: '#1C1C1A' }}>Leverans:</strong> Exakt leveransdatum och tid bekräftas separat. Avvikelse på ±1 arbetsdag kan förekomma.</p>
                  </div>
                </div>

                {/* Sign card */}
                <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E4E0' }}>
                  <p className="text-[13px] mb-4" style={{ color: '#6E6D68' }}>
                    Genom att signera bekräftar du att du tagit del av och godkänner ovanstående villkor.
                  </p>
                  <button
                    onClick={signBankId}
                    disabled={signing}
                    className="w-full h-12 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 mb-3"
                    style={{ background: '#0F6E56', color: '#FFFFFF' }}>
                    {signing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Signerar med BankID...</>
                    ) : (
                      'Signera med BankID'
                    )}
                  </button>
                  <p className="text-[11px] text-center" style={{ color: '#6E6D68' }}>
                    Manuell signering: kontakta oss på <a href="tel:+46700000000" style={{ color: '#0F6E56' }}>070-000 00 00</a>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
