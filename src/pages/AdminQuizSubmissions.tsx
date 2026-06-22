import { useEffect, useState } from 'react';
import {
  Loader2,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PortalLayout from '../components/PortalLayout';
import { useAdminNav, type AdminPage } from '../hooks/useAdminNav';

interface AdminQuizSubmissionsProps {
  onLoggedOut: () => void;
  onNavigate: (page: AdminPage) => void;
}

interface QuizSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  quiz_answers: Record<string, unknown>;
  selected_cars: Array<{ make: string; model: string; matchScore?: number }>;
  created_at: string;
}

const ANSWER_LABELS: Record<string, string> = {
  daily_use: 'Dagligt bruk',
  body_type: 'Karosstyp',
  fuel_type: 'Drivmedel',
  budget_type: 'Budgettyp',
  budget_min: 'Budget från',
  budget_max: 'Budget till',
  annual_mileage: 'Årlig körsträcka',
  priorities: 'Prioriteringar',
  brand_preference: 'Märkespreferens',
};

const VALUE_LABELS: Record<string, string> = {
  family: 'Familj',
  solo: 'Pendling',
  cargo: 'Last/transport',
  adventure: 'Äventyr',
  suv: 'SUV',
  kombi: 'Kombi',
  sedan: 'Sedan',
  hatchback: 'Halvkombi',
  coupe: 'Coupe',
  electric: 'Elbil',
  hybrid: 'Hybrid',
  petrol: 'Bensin',
  diesel: 'Diesel',
  monthly: 'Månadsbetalning',
  cash: 'Kontant',
  low: 'Låg (< 1 000 mil)',
  medium: 'Medel (1 000–2 000 mil)',
  high: 'Hög (> 2 000 mil)',
  premium: 'Premium',
  mainstream: 'Mainstream',
  value: 'Prisvärt',
  no_preference: 'Ingen preferens',
  economy: 'Låga driftskostnader',
  safety: 'Säkerhet',
  comfort: 'Komfort',
  performance: 'Prestanda',
  space: 'Utrymme',
  tech: 'Teknik',
  resale: 'Andrahandsvärde',
  reliability: 'Pålitlighet',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(v => VALUE_LABELS[v] || String(v)).join(', ');
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat('sv-SE').format(value) + ' kr';
  }
  return VALUE_LABELS[String(value)] || String(value);
}

export default function AdminQuizSubmissions({
  onLoggedOut,
  onNavigate,
}: AdminQuizSubmissionsProps) {
  const navItems = useAdminNav({ activePage: 'leads', onNavigate });
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('quiz_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setSubmissions((data ?? []) as QuizSubmission[]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLoggedOut();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('quiz_submissions').delete().eq('id', id);
    setSubmissions(prev => prev.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <PortalLayout
      navItems={navItems}
      identity="Admin"
      identityRole="Bilto"
      onLogout={handleLogout}
      pageTitle="Quiz-svar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Quiz-resultat
            {!loading && (
              <span className="ml-2 text-sm sm:text-base font-medium text-slate-400">
                ({submissions.length})
              </span>
            )}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Inga quiz-resultat att visa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  className="w-full text-left px-4 sm:px-6 py-4 flex items-center gap-3 hover:bg-[#faf8f5] transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-900">{sub.name}</span>
                      <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        {sub.phone}
                      </span>
                      {sub.email && (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          {sub.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(sub.created_at)} {formatTime(sub.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CarIcon className="w-3.5 h-3.5" />
                        {sub.selected_cars.length} valda bilar
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedId === sub.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === sub.id && (
                  <div className="border-t border-slate-100 px-4 sm:px-6 py-5 space-y-5">
                    {/* Selected Cars */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Valda bilar
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {sub.selected_cars.map((car, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0047B3]/10 text-[#0047B3] text-sm font-medium"
                          >
                            <CarIcon className="w-3.5 h-3.5" />
                            {car.make} {car.model}
                            {car.matchScore && (
                              <span className="text-xs opacity-70">({car.matchScore}%)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quiz Answers */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Quiz-svar
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(sub.quiz_answers).map(([key, value]) => {
                          if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return null;
                          return (
                            <div key={key} className="flex items-start gap-2 p-2.5 bg-[#faf8f5] rounded-lg">
                              <span className="text-xs font-semibold text-slate-500 min-w-[100px] shrink-0">
                                {ANSWER_LABELS[key] || key}
                              </span>
                              <span className="text-sm text-slate-800 font-medium">
                                {formatValue(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${sub.phone}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0047B3] text-white text-sm font-medium hover:bg-[#003d99] transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Ring kund
                      </a>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        Ta bort
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
