import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Loader2,
  Save,
  CheckCircle2,
  Lock,
  User as UserIcon,
  Building2,
  Mail,
  Phone,
  Bell,
  Users,
  UserPlus,
  Trash2,
  Crown,
  LayoutDashboard,
  Car as CarIcon,
  Settings as SettingsIcon,
  Star,
  Award,
  TrendingUp,
  Clock,
  Target,
  Zap,
  CreditCard,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';
import PortalLayout from '../components/PortalLayout';

interface DealerSettingsProps {
  dealerId: string;
  foretagsnamn: string;
  isOwner: boolean;
  onBack: () => void;
  onNavigateOverview?: () => void;
  onNavigateCars?: () => void;
  onLogout?: () => void;
}

interface DealerInfo {
  foretagsnamn: string;
  kontaktperson: string;
  telefon: string;
  mejl: string;
  faktura_epost: string;
}

interface Member {
  id: string;
  fornamn: string;
  efternamn: string;
  mejl: string;
  telefon: string;
  roll: string;
  created_at: string;
  user_id: string | null;
}

interface DealerScore {
  bilto_score: number | null;
  tier: string | null;
  response_score: number | null;
  hitrate_score: number | null;
  activity_score: number | null;
  payment_score: number | null;
  score_updated_at: string | null;
}

// ---------- Ranking helpers ----------

function tierConfig(tier: string | null): {
  label: string;
  icon: React.ReactNode;
  headerClass: string;
  badgeClass: string;
  barColor: string;
} {
  switch (tier) {
    case 'guld':
      return {
        label: 'GULD',
        icon: <Star className="w-6 h-6 fill-amber-500 text-amber-500" />,
        headerClass: 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        barColor: 'bg-amber-500',
      };
    case 'silver':
      return {
        label: 'SILVER',
        icon: <Award className="w-6 h-6 text-slate-500" />,
        headerClass: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300',
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
        barColor: 'bg-slate-500',
      };
    case 'brons':
      return {
        label: 'BRONS',
        icon: <Award className="w-6 h-6 text-orange-500" />,
        headerClass: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200',
        badgeClass: 'bg-orange-100 text-orange-700 border-orange-300',
        barColor: 'bg-orange-500',
      };
    default:
      return {
        label: 'NY',
        icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
        headerClass: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
        badgeClass: 'bg-blue-50 text-blue-600 border-blue-200',
        barColor: 'bg-blue-500',
      };
  }
}

interface ScoreBarProps {
  score: number | null;
  max: number;
  color: string;
}
function ScoreBar({ score, max, color }: ScoreBarProps) {
  const val = score ?? 0;
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface RankingCardProps {
  score: DealerScore;
}
function RankingCard({ score }: RankingCardProps) {
  const cfg = tierConfig(score.tier);
  const biltoScore = score.bilto_score ?? 0;

  const breakdown: {
    icon: React.ReactNode;
    label: string;
    value: number | null;
    hint: string;
  }[] = [
    {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Svarstid',
      value: score.response_score,
      hint: 'Svara snabbare för högre poäng',
    },
    {
      icon: <Target className="w-3.5 h-3.5" />,
      label: 'Träffsäkerhet',
      value: score.hitrate_score,
      hint: 'Vunna affärer / totalt antal bud',
    },
    {
      icon: <Zap className="w-3.5 h-3.5" />,
      label: 'Aktivitet',
      value: score.activity_score,
      hint: 'Bud lagda senaste 30 dagarna',
    },
    {
      icon: <CreditCard className="w-3.5 h-3.5" />,
      label: 'Betalning',
      value: score.payment_score,
      hint: 'Fakturahistorik',
    },
  ];

  return (
    <section className={`rounded-xl border overflow-hidden ${cfg.headerClass}`}>
      {/* Card header */}
      <div className="px-5 sm:px-6 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Tier badge + icon */}
          <div className="flex items-center gap-2.5">
            {cfg.icon}
            <div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border tracking-widest uppercase ${cfg.badgeClass}`}
              >
                {score.tier === 'guld' && (
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                )}
                {cfg.label}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Din nuvarande nivå</p>
            </div>
          </div>

          {/* Big score number */}
          <div className="text-right shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums leading-none">
              {biltoScore}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">/ 100</div>
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="bg-white px-5 sm:px-6 py-4 space-y-3.5">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400">{item.icon}</span>
              <span className="text-xs font-semibold text-slate-700">{item.label}</span>
              <span className="ml-auto text-xs font-bold text-slate-800 tabular-nums">
                {item.value ?? 0}
                <span className="font-normal text-slate-400">/25</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ScoreBar score={item.value} max={25} color={cfg.barColor} />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.hint}</p>
          </div>
        ))}
      </div>

      {/* Tip footer */}
      <div className="bg-amber-50 border-t border-amber-100 px-5 sm:px-6 py-3">
        <p className="text-xs text-amber-700 flex items-start gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Guld-handlare</strong> får leads 30 min tidigare än övriga
          </span>
        </p>
      </div>
    </section>
  );
}

// ---------- Main component ----------

export default function DealerSettings({ dealerId, foretagsnamn, isOwner, onBack, onNavigateOverview, onNavigateCars, onLogout }: DealerSettingsProps) {
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

  // Team members state
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFornamn, setInviteFornamn] = useState('');
  const [inviteEfternamn, setInviteEfternamn] = useState('');
  const [inviteMejl, setInviteMejl] = useState('');
  const [inviteTelefon, setInviteTelefon] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteDone, setInviteDone] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Ranking state
  const [dealerScore, setDealerScore] = useState<DealerScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(true);

  useEffect(() => {
    void load();
    void loadMembers();
    void loadScore();
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

  const loadScore = async () => {
    setScoreLoading(true);
    const { data } = await supabase
      .from('dealers')
      .select('bilto_score, tier, response_score, hitrate_score, activity_score, payment_score, score_updated_at')
      .eq('id', dealerId)
      .maybeSingle();
    if (data) {
      setDealerScore(data as DealerScore);
    }
    setScoreLoading(false);
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    const { data } = await supabase
      .from('dealer_members')
      .select('id, fornamn, efternamn, mejl, telefon, roll, created_at, user_id')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: true });
    setMembers(data ?? []);
    setMembersLoading(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedProfile(false);
    setSaving(true);

    const newMejl = info.mejl.trim();

    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email !== newMejl) {
      const { error: authErr } = await supabase.auth.updateUser({ email: newMejl });
      if (authErr) {
        setError('Kunde inte uppdatera mejl: ' + authErr.message);
        setSaving(false);
        return;
      }
    }

    const { error: err } = await supabase
      .from('dealers')
      .update({
        kontaktperson: info.kontaktperson.trim(),
        telefon: info.telefon.trim(),
        mejl: newMejl,
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    if (!inviteFornamn.trim() || !inviteEfternamn.trim()) {
      setInviteError('Fyll i för- och efternamn.');
      return;
    }
    if (!inviteMejl.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteMejl)) {
      setInviteError('Ange en giltig mejladress.');
      return;
    }
    setInviting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/invite-dealer-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
          Apikey: anonKey,
        },
        body: JSON.stringify({
          dealer_id: dealerId,
          fornamn: inviteFornamn.trim(),
          efternamn: inviteEfternamn.trim(),
          mejl: inviteMejl.trim().toLowerCase(),
          telefon: inviteTelefon.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setInviteError(json.error ?? 'Kunde inte bjuda in. Försök igen.');
        setInviting(false);
        return;
      }
      setInviteDone(true);
      setInviteFornamn('');
      setInviteEfternamn('');
      setInviteMejl('');
      setInviteTelefon('');
      setShowInviteForm(false);
      setTimeout(() => setInviteDone(false), 3000);
      void loadMembers();
    } catch {
      setInviteError('Nätverksfel. Försök igen.');
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Ta bort denna teammedlem? De kan inte längre logga in.')) return;
    setRemovingId(memberId);
    const { error: err } = await supabase
      .from('dealer_members')
      .delete()
      .eq('id', memberId)
      .eq('dealer_id', dealerId);
    setRemovingId(null);
    if (err) {
      alert('Kunde inte ta bort. Försök igen.');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const navItems = [
    ...(onNavigateOverview ? [{ icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Översikt', onClick: onNavigateOverview }] : []),
    ...(onNavigateCars ? [{ icon: <CarIcon className="w-[18px] h-[18px]" />, label: 'Aktiva uppdrag', onClick: onNavigateCars }] : []),
    { icon: <SettingsIcon className="w-[18px] h-[18px]" />, label: 'Inställningar', active: true },
  ];

  return (
    <PortalLayout
      navItems={navItems}
      identity={foretagsnamn}
      identityRole="Handlare"
      onLogout={onLogout}
      pageTitle="Inställningar"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <ErrorBanner message={error} />

        {/* Din Bilto-ranking — always visible (not gated on main loading) */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Din Bilto-ranking
          </h2>
          {scoreLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : dealerScore ? (
            <RankingCard score={dealerScore} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-8 text-center">
              <p className="text-sm text-slate-500">Ranking ej tillgänglig ännu.</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Företag */}
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
                    disabled={!isOwner}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Telefon" icon={<Phone className="w-4 h-4" />}>
                    <input
                      type="tel"
                      value={info.telefon}
                      onChange={(e) => setInfo({ ...info, telefon: e.target.value })}
                      disabled={!isOwner}
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </Field>
                  <Field label="Mejl" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={info.mejl}
                      onChange={(e) => setInfo({ ...info, mejl: e.target.value })}
                      disabled={!isOwner}
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </Field>
                </div>
                <Field label="Fakturamejl" icon={<Mail className="w-4 h-4" />}>
                  <input
                    type="email"
                    value={info.faktura_epost}
                    onChange={(e) => setInfo({ ...info, faktura_epost: e.target.value })}
                    disabled={!isOwner}
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </Field>
                {isOwner && (
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
                )}
                {!isOwner && (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    Bara kontoägaren kan ändra företagsinformation.
                  </p>
                )}
              </form>
            </section>

            {/* Lösenord */}
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

            {/* Team */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
              <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">Teammedlemmar</h2>
                </div>
                {isOwner && !showInviteForm && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-xs font-semibold transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Bjud in
                  </button>
                )}
              </header>

              {inviteDone && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Inbjudan skickad! Medlemmen får ett mejl med instruktioner.
                </div>
              )}

              {showInviteForm && (
                <form onSubmit={handleInvite} className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Bjud in ny teammedlem</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Förnamn">
                      <input
                        type="text"
                        value={inviteFornamn}
                        onChange={(e) => setInviteFornamn(e.target.value)}
                        placeholder="Anna"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
                      />
                    </Field>
                    <Field label="Efternamn">
                      <input
                        type="text"
                        value={inviteEfternamn}
                        onChange={(e) => setInviteEfternamn(e.target.value)}
                        placeholder="Svensson"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
                      />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Mejl">
                      <input
                        type="email"
                        value={inviteMejl}
                        onChange={(e) => setInviteMejl(e.target.value)}
                        placeholder="anna@bilhallen.se"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
                      />
                    </Field>
                    <Field label="Telefon (valfritt)">
                      <input
                        type="tel"
                        value={inviteTelefon}
                        onChange={(e) => setInviteTelefon(e.target.value)}
                        placeholder="070-000 00 00"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
                      />
                    </Field>
                  </div>
                  {inviteError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {inviteError}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowInviteForm(false); setInviteError(null); }}
                      className="h-9 px-4 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium transition"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white text-sm font-semibold transition"
                    >
                      {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      Skicka inbjudan
                    </button>
                  </div>
                </form>
              )}

              {membersLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  {isOwner
                    ? 'Inga ytterligare teammedlemmar ännu. Bjud in en kollega via knappen ovan.'
                    : 'Inga ytterligare teammedlemmar.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        {m.roll === 'owner'
                          ? <Crown className="w-4 h-4 text-amber-500" />
                          : <UserIcon className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {m.fornamn} {m.efternamn}
                          {m.roll === 'owner' && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                              Ägare
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{m.mejl}</p>
                        {m.telefon && <p className="text-xs text-slate-400">{m.telefon}</p>}
                        {!m.user_id && (
                          <span className="inline-block mt-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            Inbjudan ej accepterad
                          </span>
                        )}
                      </div>
                      {isOwner && m.roll !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={removingId === m.id}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Ta bort"
                        >
                          {removingId === m.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Aviseringar */}
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
      </div>
    </PortalLayout>
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
