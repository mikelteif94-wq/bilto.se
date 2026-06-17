import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, Loader2, ArrowRight, BookmarkPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface SaveToPortalBannerProps {
  /** The data to save as quiz_answers JSON in quote_requests */
  quizAnswers: Record<string, unknown>;
  /** Short summary label shown in the portal row e.g. "Bilmatch – quiz" */
  source: string;
  /** Optional pre-fill car name for target_car field */
  carLabel?: string;
  /** Called when the record has been saved (passes the access_token) */
  onSaved?: (accessToken: string | null) => void;
}

export default function SaveToPortalBanner({
  quizAnswers,
  source,
  carLabel,
  onSaved,
}: SaveToPortalBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Ange en giltig e-postadress.');
      return;
    }
    if (!phone.trim()) {
      setError('Ange ditt telefonnummer.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const [firstName, ...rest] = name.trim().split(' ');

      const { data: inserted, error: dbErr } = await supabase
        .from('quote_requests')
        .insert({
          search_option: 'searching',
          firstname: firstName || '',
          lastname: rest.join(' ') || '',
          email: trimmedEmail,
          phone: phone.trim(),
          car_model: carLabel || '',
          target_car: carLabel || '',
          quiz_answers: quizAnswers,
          source,
          status: 'new',
        })
        .select('id, access_token')
        .maybeSingle();

      if (dbErr) {
        setError('Kunde inte spara. Försök igen.');
        return;
      }

      const token = (inserted as { access_token?: string } | null)?.access_token ?? null;
      const qrId = (inserted as { id?: string } | null)?.id ?? null;

      // Send magic link email
      if (qrId) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/notify-quote-request`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${ANON_KEY}`,
              Apikey: ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quote_request_id: qrId }),
          });
        } catch { /* best effort */ }
      }

      setSentEmail(trimmedEmail);
      setDone(true);
      onSaved?.(token);
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-start gap-3"
      >
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-emerald-800">Sparat! Kolla din mejl</p>
          <p className="text-[12px] text-emerald-700 mt-0.5">
            Vi skickade en portal-länk till <strong>{sentEmail}</strong>. Klicka på länken för att logga in och se dina resultat.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Collapsed teaser */}
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
            <BookmarkPlus className="w-4 h-4 text-[#0e6efe]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">Spara resultaten i portalen</p>
            <p className="text-[11px] text-slate-400">Logga in via mejl — inga lösenord</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      ) : (
        <AnimatePresence>
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSave}
            className="px-5 py-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-[#0e6efe]" />
              <p className="text-[13px] font-bold text-slate-800">Spara & följ via portalen</p>
            </div>
            <p className="text-[12px] text-slate-500">
              Vi skickar en säker inloggningslänk — du ser dina resultat och kan följa ärendet därifrån.
            </p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ditt namn (valfritt)"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition"
            />
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(null); }}
              placeholder="Telefonnummer *"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition"
            />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              placeholder="E-postadress *"
              autoComplete="email"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/20 focus:border-[#0e6efe] transition"
            />
            {error && <p className="text-[12px] text-red-600 font-medium">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-500 text-[13px] font-medium hover:bg-slate-50 transition"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-10 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:bg-slate-200 text-white text-[13px] font-bold transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Skicka mig länken <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-400">Ingen registrering — en säker länk direkt i din mejl</p>
          </motion.form>
        </AnimatePresence>
      )}
    </div>
  );
}
