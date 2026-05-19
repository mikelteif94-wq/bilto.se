import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  LogOut,
  Mail,
  Phone,
  User,
  Building2,
  Check,
  Hash,
  Calendar,
  MapPin,
  Receipt,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import AdminUserLabel from '../components/AdminUserLabel';

interface AdminDealerDetailProps {
  dealerId: string;
  onBack: () => void;
  onLoggedOut: () => void;
}

type Dealer = Database['public']['Tables']['dealers']['Row'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDealerDetail({
  dealerId,
  onBack,
  onLoggedOut,
}: AdminDealerDetailProps) {
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvedJustNow, setApprovedJustNow] = useState(false);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dealers')
        .select('*')
        .eq('id', dealerId)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Kunde inte hämta handlaren.');
      } else {
        setDealer(data as Dealer);
      }
      setLoading(false);
    })();
  }, [dealerId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const handleApprove = async () => {
    if (!dealer) return;
    setApproving(true);
    setEmailWarning(null);

    const { data: updated, error: updateError } = await supabase
      .from('dealers')
      .update({ godkand: true })
      .eq('id', dealer.id)
      .select('*')
      .maybeSingle();

    if (updateError || !updated) {
      setError('Kunde inte uppdatera handlaren.');
      setApproving(false);
      return;
    }

    setDealer(updated as Dealer);
    setApprovedJustNow(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-dealer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ dealer_id: dealer.id }),
        },
      );
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setEmailWarning(body?.error ?? 'Välkomstmejlet kunde inte skickas.');
      }
    } catch {
      setEmailWarning('Välkomstmejlet kunde inte skickas.');
    }

    setApproving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-700 mb-6">{error ?? 'Handlaren hittades inte.'}</p>
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-10 gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/90 hover:text-white transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Till handlare</span>
        </button>
        <a href="/" className="flex items-center shrink-0 ml-1">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-20 sm:h-28 w-auto object-contain"
          />
        </a>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <AdminUserLabel />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition"
            aria-label="Logga ut"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logga ut</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Handlare
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
              {dealer.foretagsnamn}
            </h1>
            <p className="text-slate-500 mt-1 font-mono text-sm">{dealer.orgnr}</p>
          </div>
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ring-1 ring-inset shrink-0 ${
              dealer.godkand
                ? 'bg-green-600 text-white ring-green-600'
                : 'bg-amber-50 text-amber-700 ring-amber-200'
            }`}
          >
            {dealer.godkand ? 'Godkänd' : 'Väntar'}
          </span>
        </div>

        <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          <InfoRow
            icon={<Building2 className="w-4 h-4" />}
            label="Företag"
            value={dealer.foretagsnamn}
          />
          <InfoRow
            icon={<Hash className="w-4 h-4" />}
            label="Moderbolag org.nr"
            value={dealer.moderbolag || dealer.orgnr}
            mono
          />
          {Array.isArray(dealer.organisationsnummer) && dealer.organisationsnummer.length > 0 && (
            <InfoRow
              icon={<Hash className="w-4 h-4" />}
              label="Alla organisationsnummer"
              value={
                <ul className="space-y-0.5">
                  {dealer.organisationsnummer.map((o, i) => (
                    <li key={i} className="font-mono text-slate-900">{o}</li>
                  ))}
                </ul>
              }
            />
          )}
          {Array.isArray(dealer.adresser) && dealer.adresser.length > 0 && (
            <InfoRow
              icon={<MapPin className="w-4 h-4" />}
              label="Inköpsadresser"
              value={
                <ul className="space-y-0.5">
                  {dealer.adresser.map((a, i) => (
                    <li key={i} className="text-slate-900">{a}</li>
                  ))}
                </ul>
              }
            />
          )}
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Kontaktperson"
            value={
              [dealer.fornamn, dealer.efternamn].filter(Boolean).join(' ') ||
              dealer.kontaktperson
            }
          />
          <InfoRow
            icon={<Phone className="w-4 h-4" />}
            label="Telefon"
            value={
              dealer.telefon ? (
                <a
                  href={`tel:${dealer.telefon}`}
                  className="text-slate-900 hover:text-slate-700"
                >
                  {dealer.telefon}
                </a>
              ) : (
                '—'
              )
            }
          />
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label="Mejl (inloggning)"
            value={
              dealer.mejl ? (
                <a
                  href={`mailto:${dealer.mejl}`}
                  className="text-slate-900 hover:text-slate-700"
                >
                  {dealer.mejl}
                </a>
              ) : (
                '—'
              )
            }
          />
          {dealer.faktura_epost && (
            <InfoRow
              icon={<Receipt className="w-4 h-4" />}
              label="Faktura-e-post"
              value={
                <a
                  href={`mailto:${dealer.faktura_epost}`}
                  className="text-slate-900 hover:text-slate-700"
                >
                  {dealer.faktura_epost}
                </a>
              }
            />
          )}
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Ansökan inkom"
            value={formatDate(dealer.created_at)}
          />
        </div>

        <div className="mt-6 sm:mt-8 bg-white rounded-md border border-slate-200 p-5 sm:p-8 shadow-sm">
          {dealer.godkand ? (
            <div className="flex items-start gap-3 text-slate-700">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Handlaren är godkänd</p>
                <p className="text-sm text-slate-500 mt-1">
                  {approvedJustNow
                    ? 'Välkomstmejl har skickats med inloggningslänk.'
                    : 'Handlaren kan logga in och lägga bud.'}
                </p>
                {emailWarning && (
                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {emailWarning}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Godkänn handlare
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                Handlaren får tillgång till att lägga bud och ett välkomstmejl med
                inloggningslänk.
              </p>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center gap-2 h-11 bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-[14px] rounded-full px-5 transition"
              >
                {approving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {approving ? 'Godkänner…' : 'Godkänn handlare'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}
