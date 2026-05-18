import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Building2,
  Mail,
  Phone,
  Bell,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';

interface DealerSettingsProps {
  dealerId: string;
  onBack: () => void;
}

interface DealerInfo {
  foretagsnamn: string;
  kontaktperson: string;
  telefon: string;
  mejl: string;
  faktura_epost: string;
}

export default function DealerSettings({ dealerId, onBack }: DealerSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<DealerInfo>({
    foretagsnamn: '',
    kontaktperson: '',
    telefon: '',
    mejl: '',
    faktura_epost: '',
  });

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);

  useEffect(() => {
    void load();
  }, [dealerId]);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('dealers')
      .select('foretagsnamn, kontaktperson, telefon, mejl, faktura_epost')
      .eq('id', dealerId)
      .maybeSingle();
    if (err) {
      setError('Kunde inte hämta uppgifter.');
    } else if (data) {
      setInfo({
        foretagsnamn: data.foretagsnamn ?? '',
        kontaktperson: data.kontaktperson ?? '',
        telefon: data.telefon ?? '',
        mejl: data.mejl ?? '',
        faktura_epost: data.faktura_epost ?? '',
      });
    }
    setLoading(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedProfile(false);
    setSaving(true);
    const { error: err } = await supabase
      .from('dealers')
      .update({
        kontaktperson: info.kontaktperson.trim(),
        telefon: info.telefon.trim(),
        mejl: info.mejl.trim(),
        faktura_epost: info.faktura_epost.trim(),
      })
      .eq('id', dealerId);
    setSaving(false);
    if (err) {
      setError('Kunde inte spara. Försök igen.');
      return;
    }
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pw.length < 8) {
      setPwError('Minst 8 tecken.');
      return;
    }
    if (pw !== pw2) {
      setPwError('Lösenorden matchar inte.');
      return;
    }
    setPwSaving(true);
    const { error: updErr } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);
    if (updErr) {
      setPwError(updErr.message);
      return;
    }
    setPwDone(true);
    setPw('');
    setPw2('');
    setTimeout(() => setPwDone(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0e6efe] h-14 sm:h-16 flex items-center px-3 sm:px-5 lg:px-8 sticky top-0 z-10 gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tillbaka</span>
        </button>
        <h1 className="ml-3 text-sm sm:text-base font-semibold text-white">Inställningar</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <header className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Företag</h2>
              </header>
              <form onSubmit={saveProfile} className="space-y-4">
                <Field label="Företagsnamn" icon={<Building2 className="w-4 h-4" />}>
                  <input
                    type="text"
                    value={info.foretagsnamn}
                    disabled
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Kontakta supporten för att ändra företagsnamn.
                  </p>
                </Field>
                <Field label="Kontaktperson" icon={<UserIcon className="w-4 h-4" />}>
                  <input
                    type="text"
                    value={info.kontaktperson}
                    onChange={(e) => setInfo({ ...info, kontaktperson: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                  />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Telefon" icon={<Phone className="w-4 h-4" />}>
                    <input
                      type="tel"
                      value={info.telefon}
                      onChange={(e) => setInfo({ ...info, telefon: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                    />
                  </Field>
                  <Field label="Mejl" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={info.mejl}
                      onChange={(e) => setInfo({ ...info, mejl: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                    />
                  </Field>
                </div>
                <Field label="Fakturamejl" icon={<Mail className="w-4 h-4" />}>
                  <input
                    type="email"
                    value={info.faktura_epost}
                    onChange={(e) => setInfo({ ...info, faktura_epost: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                  />
                </Field>
                <div className="flex items-center justify-end gap-3 pt-2">
                  {savedProfile && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Sparat
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold transition"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Spara ändringar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <header className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Lösenord</h2>
              </header>
              <form onSubmit={submitPw} className="space-y-4 max-w-md">
                <Field label="Nytt lösenord">
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                  />
                </Field>
                <Field label="Bekräfta lösenord">
                  <input
                    type="password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none"
                  />
                </Field>
                {pwError && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {pwError}
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 pt-1">
                  {pwDone && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Uppdaterat
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold transition"
                  >
                    {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Byt lösenord
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <header className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Aviseringar</h2>
              </header>
              <p className="text-sm text-slate-600 leading-relaxed">
                Du får mejl till <strong>{info.mejl || '—'}</strong> när nya bilar går ut till bud
                och när en auktion du deltar i avslutas. Vill du ändra mejl, uppdatera
                fältet ovan och spara.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
