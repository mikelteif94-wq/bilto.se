import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import DealerShell from '../components/DealerShell';
import { supabase } from '../lib/supabase';

interface Props {
  dealerId: string;
  foretagsnamn: string;
  onLoggedOut: () => void;
}

interface DealerData {
  foretagsnamn: string;
  stad: string;
  email: string;
  telefon: string;
  beskrivning: string;
}

export default function DealerProfile({ dealerId, foretagsnamn, onLoggedOut }: Props) {
  const [data, setData] = useState<DealerData>({
    foretagsnamn: '',
    stad: '',
    email: '',
    telefon: '',
    beskrivning: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: dealerData, error: err } = await supabase
          .from('dealers')
          .select('foretagsnamn,stad,email,telefon,beskrivning')
          .eq('id', dealerId)
          .maybeSingle();

        if (err) throw err;
        if (dealerData) {
          setData({
            foretagsnamn: dealerData.foretagsnamn || '',
            stad: dealerData.stad || '',
            email: dealerData.email || '',
            telefon: dealerData.telefon || '',
            beskrivning: dealerData.beskrivning || '',
          });
        }
      } catch {
        setError('Kunde inte ladda profilen.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dealerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: err } = await supabase
        .from('dealers')
        .update({
          foretagsnamn: data.foretagsnamn,
          stad: data.stad,
          email: data.email,
          telefon: data.telefon,
          beskrivning: data.beskrivning,
        })
        .eq('id', dealerId);

      if (err) throw err;
      setSuccess('Profilen sparades framgångsrikt.');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Kunde inte spara profilen.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DealerShell activePage="profil" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
        <div className="text-center py-12">
          <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif' }}>Laddar...</p>
        </div>
      </DealerShell>
    );
  }

  return (
    <DealerShell activePage="profil" foretagsnamn={foretagsnamn} onLoggedOut={onLoggedOut}>
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: '"Anton", "Impact", sans-serif', color: '#0E1B33' }}
        >
          MIN PROFIL
        </h1>
        <p style={{ color: '#6B7486', fontFamily: '"Signika", ui-sans-serif', marginBottom: '2rem' }} className="text-sm">
          Uppdatera dina företagsuppgifter och kontaktinformation.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-6 rounded-xl bg-white border border-[#E8ECF3]">
            <div className="space-y-4">
              <div>
                <label style={{ fontFamily: '"Signika", ui-sans-serif', color: '#0E1B33', fontSize: '13px', fontWeight: 600 }} className="block mb-2 uppercase tracking-wide">
                  Företagsnamn
                </label>
                <input
                  type="text"
                  value={data.foretagsnamn}
                  onChange={(e) => setData({ ...data, foretagsnamn: e.target.value })}
                  className="w-full px-4 h-11 rounded-xl bg-white border outline-none transition-colors"
                  style={{
                    borderColor: '#E8ECF3',
                    fontFamily: '"Signika", ui-sans-serif',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0E1B33')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8ECF3')}
                />
              </div>

              <div>
                <label style={{ fontFamily: '"Signika", ui-sans-serif', color: '#0E1B33', fontSize: '13px', fontWeight: 600 }} className="block mb-2 uppercase tracking-wide">
                  Stad
                </label>
                <input
                  type="text"
                  value={data.stad}
                  onChange={(e) => setData({ ...data, stad: e.target.value })}
                  className="w-full px-4 h-11 rounded-xl bg-white border outline-none transition-colors"
                  style={{
                    borderColor: '#E8ECF3',
                    fontFamily: '"Signika", ui-sans-serif',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0E1B33')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8ECF3')}
                />
              </div>

              <div>
                <label style={{ fontFamily: '"Signika", ui-sans-serif', color: '#0E1B33', fontSize: '13px', fontWeight: 600 }} className="block mb-2 uppercase tracking-wide">
                  E-post
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full px-4 h-11 rounded-xl bg-white border outline-none transition-colors"
                  style={{
                    borderColor: '#E8ECF3',
                    fontFamily: '"Signika", ui-sans-serif',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0E1B33')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8ECF3')}
                />
              </div>

              <div>
                <label style={{ fontFamily: '"Signika", ui-sans-serif', color: '#0E1B33', fontSize: '13px', fontWeight: 600 }} className="block mb-2 uppercase tracking-wide">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={data.telefon}
                  onChange={(e) => setData({ ...data, telefon: e.target.value })}
                  className="w-full px-4 h-11 rounded-xl bg-white border outline-none transition-colors"
                  style={{
                    borderColor: '#E8ECF3',
                    fontFamily: '"Signika", ui-sans-serif',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0E1B33')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8ECF3')}
                />
              </div>

              <div>
                <label style={{ fontFamily: '"Signika", ui-sans-serif', color: '#0E1B33', fontSize: '13px', fontWeight: 600 }} className="block mb-2 uppercase tracking-wide">
                  Beskrivning
                </label>
                <textarea
                  value={data.beskrivning}
                  onChange={(e) => setData({ ...data, beskrivning: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white border outline-none transition-colors resize-none"
                  style={{
                    borderColor: '#E8ECF3',
                    fontFamily: '"Signika", ui-sans-serif',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0E1B33')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8ECF3')}
                />
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
              <XCircle className="w-5 h-5 shrink-0 mt-[1px]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-2.5 p-3 rounded-xl text-[#00A85A] text-sm border" style={{ background: 'rgba(0,168,90,0.05)', borderColor: 'rgba(0,168,90,0.2)' }}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-[1px]" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-11 px-8 rounded-full font-bold text-sm transition-all"
            style={{
              background: '#FFD500',
              color: '#0E1B33',
              fontFamily: '"Signika", ui-sans-serif',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Sparar...' : 'Spara profil'}
          </button>
        </form>
      </div>
    </DealerShell>
  );
}
