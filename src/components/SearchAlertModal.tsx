import { useState } from 'react';
import { X, Bell, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface SearchAlertModalProps {
  open: boolean;
  onClose: () => void;
  filters: Record<string, unknown>;
  filterLabel: string;
}

export default function SearchAlertModal({ open, onClose, filters, filterLabel }: SearchAlertModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Ange en giltig e-postadress.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: dbErr } = await supabase.from('search_alerts').insert({
      email: email.trim().toLowerCase(),
      filters,
      label: filterLabel,
    });
    setLoading(false);
    if (dbErr) {
      setError('Något gick fel. Försök igen.');
      return;
    }
    setDone(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-[20%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-50 bg-white rounded-2xl shadow-2xl p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {done ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-[17px] font-extrabold text-slate-900 mb-2">Bevakning satt!</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Vi meddelar dig på <span className="font-semibold text-slate-700">{email}</span> när nya bilar matchar din sökning.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 w-full h-11 rounded-xl bg-[#0e6efe] text-white text-[13px] font-bold hover:bg-[#0a57cc] transition"
                >
                  Stäng
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#0e6efe]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-[#0e6efe]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900">Bevaka sökning</h3>
                    <p className="text-[12px] text-slate-500">Få e-post när nya bilar matchar</p>
                  </div>
                </div>

                {filterLabel && (
                  <div className="bg-[#faf8f5] rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Dina filter</p>
                    <p className="text-[13px] font-semibold text-slate-700">{filterLabel}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
                      Din e-postadress
                    </label>
                    <input
                      type="email"
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="namn@exempel.se"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0e6efe]/30 focus:border-[#0e6efe]/50"
                    />
                  </div>
                  {error && <p className="text-[12px] text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-[#0e6efe] hover:bg-[#0a57cc] disabled:opacity-60 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                    {loading ? 'Sparar…' : 'Aktivera bevakning'}
                  </button>
                  <p className="text-[10.5px] text-slate-400 text-center leading-relaxed">
                    Vi skickar aldrig spam. Avregistrering med ett klick.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
