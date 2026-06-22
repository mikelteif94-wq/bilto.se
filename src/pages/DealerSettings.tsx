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
  ShoppingCart,
  X,
  Plus,
  MapPin,
  Gauge,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
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

interface BuyPrefs {
  marken: string[];
  segment: string[];
  regions: string[];
  max_miltal: string;
  min_ar: string;
  max_ar: string;
  min_pris: string;
  max_pris: string;
}

const EMPTY_PREFS: BuyPrefs = {
  marken: [], segment: [], regions: [],
  max_miltal: '', min_ar: '', max_ar: '', min_pris: '', max_pris: '',
};

const BRAND_OPTIONS = [
  'Audi','BMW','Chevrolet','Citroën','Dacia','Fiat','Ford','Honda','Hyundai',
  'Jaguar','Jeep','Kia','Land Rover','Lexus','Mazda','Mercedes-Benz','MG',
  'Mini','Mitsubishi','Nissan','Opel','Peugeot','Porsche','Renault','Seat',
  'Skoda','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo',
];

const SEGMENT_OPTIONS = [
  { value: 'suv',       label: 'SUV' },
  { value: 'kombi',     label: 'Kombi' },
  { value: 'sedan',     label: 'Sedan' },
  { value: 'halvkombi', label: 'Halvkombi' },
  { value: 'cab',       label: 'Cab' },
  { value: 'skåp',      label: 'Skåpbil' },
  { value: 'minibuss',  label: 'Minibuss' },
];

const REGION_OPTIONS = [
  'Stockholm','Göteborg','Malmö','Uppsala','Västerås','Örebro',
  'Linköping','Helsingborg','Jönköping','Norrköping',
  'Lund','Umeå','Gävle','Borås','Södertälje',
];

// ---------- Ranking helpers ----------

function TierMedal({ tier }: { tier: string | null }) {
  if (tier === 'guld') {
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg viewBox="0 0 56 64" className="w-14 h-14 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* ribbon left */}
          <path d="M18 6 L10 26 L20 22 Z" fill="#b45309" />
          {/* ribbon right */}
          <path d="M38 6 L46 26 L36 22 Z" fill="#b45309" />
          {/* ribbon top bar */}
          <rect x="16" y="2" width="24" height="10" rx="3" fill="#d97706" />
          {/* medal circle */}
          <circle cx="28" cy="40" r="20" fill="url(#goldGrad)" />
          <circle cx="28" cy="40" r="17" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* star */}
          <path d="M28 30 L29.8 36.2 H36.2 L31.2 40.1 L33 46.3 L28 42.4 L23 46.3 L24.8 40.1 L19.8 36.2 H26.2 Z" fill="#fef3c7" />
          <defs>
            <radialGradient id="goldGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }
  if (tier === 'silver') {
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg viewBox="0 0 56 64" className="w-14 h-14 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6 L10 26 L20 22 Z" fill="#64748b" />
          <path d="M38 6 L46 26 L36 22 Z" fill="#64748b" />
          <rect x="16" y="2" width="24" height="10" rx="3" fill="#94a3b8" />
          <circle cx="28" cy="40" r="20" fill="url(#silverGrad)" />
          <circle cx="28" cy="40" r="17" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M28 30 L29.8 36.2 H36.2 L31.2 40.1 L33 46.3 L28 42.4 L23 46.3 L24.8 40.1 L19.8 36.2 H26.2 Z" fill="#f1f5f9" />
          <defs>
            <radialGradient id="silverGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }
  if (tier === 'brons') {
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg viewBox="0 0 56 64" className="w-14 h-14 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6 L10 26 L20 22 Z" fill="#92400e" />
          <path d="M38 6 L46 26 L36 22 Z" fill="#92400e" />
          <rect x="16" y="2" width="24" height="10" rx="3" fill="#b45309" />
          <circle cx="28" cy="40" r="20" fill="url(#bronzeGrad)" />
          <circle cx="28" cy="40" r="17" fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M28 30 L29.8 36.2 H36.2 L31.2 40.1 L33 46.3 L28 42.4 L23 46.3 L24.8 40.1 L19.8 36.2 H26.2 Z" fill="#fde68a" />
          <defs>
            <radialGradient id="bronzeGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="100%" stopColor="#92400e" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }
  // default: new/unranked
  return (
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-blue-500" />
    </div>
  );
}

function tierConfig(tier: string | null): {
  label: string;
  headerClass: string;
  badgeClass: string;
  barColor: string;
} {
  switch (tier) {
    case 'guld':
      return {
        label: 'Guld',
        headerClass: 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        barColor: 'bg-amber-500',
      };
    case 'silver':
      return {
        label: 'Silver',
        headerClass: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300',
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
        barColor: 'bg-slate-500',
      };
    case 'brons':
      return {
        label: 'Brons',
        headerClass: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200',
        badgeClass: 'bg-orange-100 text-orange-700 border-orange-300',
        barColor: 'bg-orange-500',
      };
    default:
      return {
        label: 'Ny',
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
        className={`h-full rounded-xl transition-all ${color}`}
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
          {/* Tier medal + label */}
          <div className="flex items-center gap-3">
            <TierMedal tier={score.tier} />
            <div>
              <p className="text-lg font-bold text-slate-900 leading-tight">{cfg.label}</p>
              <p className="text-xs text-slate-500">Din nuvarande nivå</p>
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
      <div className="bg-[#faf8f5] px-5 sm:px-6 py-4 space-y-3.5">
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

  // Buy preferences state
  const [buyPrefs, setBuyPrefs] = useState<BuyPrefs>(EMPTY_PREFS);
  const [buyPrefsLoading, setBuyPrefsLoading] = useState(true);
  const [buyPrefsSaving, setBuyPrefsSaving] = useState(false);
  const [buyPrefsSaved, setBuyPrefsSaved] = useState(false);
  const [brandInput, setBrandInput] = useState('');
  const [regionInput, setRegionInput] = useState('');

  // Blocket integration state
  const [blocketApiKey, setBlocketApiKey] = useState('');
  const [blocketStoreId, setBlocketStoreId] = useState('');
  const [blocketSyncEnabled, setBlocketSyncEnabled] = useState(false);
  const [blocketLastSync, setBlocketLastSync] = useState<string | null>(null);
  const [blocketLoading, setBlocketLoading] = useState(true);
  const [blocketSaving, setBlocketSaving] = useState(false);
  const [blocketSaved, setBlocketSaved] = useState(false);
  const [blocketSyncing, setBlocketSyncing] = useState(false);
  const [blocketSyncResult, setBlocketSyncResult] = useState<{ ok: number; skipped: number } | null>(null);
  const [blocketError, setBlocketError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    void load();
    void loadMembers();
    void loadScore();
    void loadBuyPrefs();
    void loadBlocket();
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

  const loadBuyPrefs = async () => {
    setBuyPrefsLoading(true);
    const { data } = await supabase
      .from('dealer_buy_preferences')
      .select('*')
      .eq('dealer_id', dealerId)
      .maybeSingle();
    if (data) {
      setBuyPrefs({
        marken: data.marken ?? [],
        segment: data.segment ?? [],
        regions: data.regions ?? [],
        max_miltal: data.max_miltal != null ? String(data.max_miltal) : '',
        min_ar: data.min_ar != null ? String(data.min_ar) : '',
        max_ar: data.max_ar != null ? String(data.max_ar) : '',
        min_pris: data.min_pris != null ? String(data.min_pris) : '',
        max_pris: data.max_pris != null ? String(data.max_pris) : '',
      });
    }
    setBuyPrefsLoading(false);
  };

  const saveBuyPrefs = async () => {
    setBuyPrefsSaving(true);
    const payload = {
      dealer_id: dealerId,
      marken: buyPrefs.marken,
      segment: buyPrefs.segment,
      regions: buyPrefs.regions,
      max_miltal: buyPrefs.max_miltal ? Number(buyPrefs.max_miltal) : null,
      min_ar: buyPrefs.min_ar ? Number(buyPrefs.min_ar) : null,
      max_ar: buyPrefs.max_ar ? Number(buyPrefs.max_ar) : null,
      min_pris: buyPrefs.min_pris ? Number(buyPrefs.min_pris) : null,
      max_pris: buyPrefs.max_pris ? Number(buyPrefs.max_pris) : null,
      aktiv: true,
    };
    await supabase
      .from('dealer_buy_preferences')
      .upsert(payload, { onConflict: 'dealer_id' });
    setBuyPrefsSaving(false);
    setBuyPrefsSaved(true);
    setTimeout(() => setBuyPrefsSaved(false), 2000);
  };

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const loadBlocket = async () => {
    setBlocketLoading(true);
    const { data } = await supabase
      .from('dealers')
      .select('blocket_api_key, blocket_store_id, blocket_sync_enabled, blocket_last_sync')
      .eq('id', dealerId)
      .maybeSingle();
    if (data) {
      setBlocketApiKey(data.blocket_api_key ?? '');
      setBlocketStoreId(data.blocket_store_id ?? '');
      setBlocketSyncEnabled(data.blocket_sync_enabled ?? false);
      setBlocketLastSync(data.blocket_last_sync ?? null);
    }
    setBlocketLoading(false);
  };

  const saveBlocket = async () => {
    setBlocketError(null);
    setBlocketSaving(true);
    const { error: err } = await supabase
      .from('dealers')
      .update({
        blocket_api_key: blocketApiKey.trim() || null,
        blocket_store_id: blocketStoreId.trim() || null,
        blocket_sync_enabled: blocketSyncEnabled,
      })
      .eq('id', dealerId);
    setBlocketSaving(false);
    if (err) {
      setBlocketError('Kunde inte spara. Försök igen.');
      return;
    }
    setBlocketSaved(true);
    setTimeout(() => setBlocketSaved(false), 2000);
  };

  const runBlocketSync = async () => {
    if (!blocketApiKey.trim()) {
      setBlocketError('Ange en API-nyckel först.');
      return;
    }
    setBlocketError(null);
    setBlocketSyncing(true);
    setBlocketSyncResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/sync-blocket-inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
          Apikey: anonKey,
        },
        body: JSON.stringify({ dealer_id: dealerId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBlocketError(json.error ?? 'Synkronisering misslyckades.');
      } else {
        setBlocketSyncResult({ ok: json.imported ?? 0, skipped: json.skipped ?? 0 });
        setBlocketLastSync(new Date().toISOString());
        await supabase.from('dealers').update({ blocket_last_sync: new Date().toISOString() }).eq('id', dealerId);
      }
    } catch {
      setBlocketError('Nätverksfel. Kontrollera API-nyckeln och försök igen.');
    }
    setBlocketSyncing(false);
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

        {/* Din Bilto-ranking – always visible (not gated on main loading) */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Din Bilto-ranking
          </h2>
          {scoreLoading ? (
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : dealerScore ? (
            <RankingCard score={dealerScore} />
          ) : (
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 px-5 py-8 text-center">
              <p className="text-sm text-slate-500">Ranking ej tillgänglig ännu.</p>
            </div>
          )}
        </div>

        {/* Köpintressen – used by the matching engine */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-[#0e6efe]" />
            Köpintressen
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Berätta vilka bilar du vill köpa. Matchningsmotorn använder detta för att skicka rätt leads till dig.
          </p>
          {buyPrefsLoading ? (
            <div className="bg-[#faf8f5] rounded-xl border border-slate-200 flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">

              {/* Brands */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Märken du köper
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {BRAND_OPTIONS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBuyPrefs((p) => ({ ...p, marken: toggleArrayItem(p.marken, b) }))}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                        buyPrefs.marken.includes(b)
                          ? 'bg-[#0e6efe] text-white border-[#0e6efe]'
                          : 'bg-[#faf8f5] text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {buyPrefs.marken.length === 0 && (
                  <p className="text-xs text-slate-400">Inget valt = matchar alla märken</p>
                )}
              </div>

              {/* Segments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Karosstyper
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SEGMENT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setBuyPrefs((p) => ({ ...p, segment: toggleArrayItem(p.segment, s.value) }))}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                        buyPrefs.segment.includes(s.value)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-[#faf8f5] text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Regioner
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {REGION_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setBuyPrefs((p) => ({ ...p, regions: toggleArrayItem(p.regions, r) }))}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                        buyPrefs.regions.includes(r)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#faf8f5] text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {buyPrefs.regions.length === 0 && (
                  <p className="text-xs text-slate-400">Inget valt = hela Sverige</p>
                )}
              </div>

              {/* Numeric filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { key: 'min_ar',    label: 'Från år',     icon: <Clock className="w-3.5 h-3.5" />,   placeholder: '2015' },
                  { key: 'max_ar',    label: 'Till år',     icon: <Clock className="w-3.5 h-3.5" />,   placeholder: '2024' },
                  { key: 'max_miltal',label: 'Max miltal',  icon: <Gauge className="w-3.5 h-3.5" />,   placeholder: '15000' },
                  { key: 'max_pris',  label: 'Max pris',    icon: <CreditCard className="w-3.5 h-3.5" />, placeholder: '500000' },
                ] as { key: keyof BuyPrefs; label: string; icon: React.ReactNode; placeholder: string }[]).map(({ key, label, icon, placeholder }) => (
                  <label key={key} className="block">
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      {icon}{label}
                    </span>
                    <input
                      type="number"
                      value={buyPrefs[key] as string}
                      onChange={(e) => setBuyPrefs((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                {buyPrefsSaved && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Sparat
                  </span>
                )}
                <button
                  type="button"
                  onClick={saveBuyPrefs}
                  disabled={buyPrefsSaving}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold transition"
                >
                  {buyPrefsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Spara köpintressen
                </button>
              </div>
            </section>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Företag */}
            <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
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
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold transition"
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
            <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
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
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold transition"
                  >
                    {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Byt lösenord
                  </button>
                </div>
              </form>
            </section>

            {/* Team */}
            <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
              <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">Teammedlemmar</h2>
                </div>
                {isOwner && !showInviteForm && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] text-white text-xs font-semibold transition"
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
                      className="h-9 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium transition"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white text-sm font-semibold transition"
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
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
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
            <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6">
              <header className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Aviseringar</h2>
              </header>
              <p className="text-sm text-slate-600 leading-relaxed">
                Du får mejl till <strong>{info.mejl || '–'}</strong> när nya bilar går ut till bud
                och när en auktion du deltar i avslutas. Vill du ändra mejl, uppdatera
                fältet ovan och spara.
              </p>
            </section>

            {/* Blocket integration */}
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-[#0e6efe]" />
                Blocket-integration
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Koppla din Blocket-butik så att ditt lager hålls automatiskt uppdaterat.
              </p>
              {blocketLoading ? (
                <div className="bg-[#faf8f5] rounded-xl border border-slate-200 flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <section className="bg-[#faf8f5] rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
                  {/* Info banner */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 leading-relaxed">
                      <strong>Hitta din API-nyckel:</strong> Logga in på Blocket Företag &rarr; Inställningar &rarr; API &rarr; Skapa nyckel. Kopiera nyckeln och klistra in den nedan.
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Blocket API-nyckel">
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={blocketApiKey}
                          onChange={(e) => setBlocketApiKey(e.target.value)}
                          placeholder="Klistra in din API-nyckel"
                          className="w-full h-11 px-3 pr-10 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Butik-ID (valfritt)">
                      <input
                        type="text"
                        value={blocketStoreId}
                        onChange={(e) => setBlocketStoreId(e.target.value)}
                        placeholder="T.ex. 12345678"
                        className="w-full h-11 px-3 rounded-lg border border-slate-200 focus:border-[#0e6efe] focus:ring-2 focus:ring-[#0e6efe]/20 outline-none text-sm"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={blocketSyncEnabled}
                      onClick={() => setBlocketSyncEnabled((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-xl transition-colors ${blocketSyncEnabled ? 'bg-[#0e6efe]' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-[#faf8f5] shadow transition-transform ${blocketSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-slate-700 font-medium">Aktivera automatisk synkronisering</span>
                  </div>

                  {blocketError && (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {blocketError}
                    </div>
                  )}

                  {blocketSyncResult && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Synkronisering klar! <strong>{blocketSyncResult.ok}</strong> bilar importerade
                        {blocketSyncResult.skipped > 0 ? `, ${blocketSyncResult.skipped} hoppades över` : ''}.
                      </span>
                    </div>
                  )}

                  {blocketLastSync && (
                    <p className="text-xs text-slate-400">
                      Senast synkad: {new Date(blocketLastSync).toLocaleString('sv')}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={runBlocketSync}
                      disabled={blocketSyncing || !blocketApiKey.trim()}
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition"
                    >
                      {blocketSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Synka nu
                    </button>
                    <div className="flex items-center gap-2 ml-auto">
                      {blocketSaved && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Sparat
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={saveBlocket}
                        disabled={blocketSaving}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-300 text-white font-semibold text-sm transition"
                      >
                        {blocketSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Spara
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
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
