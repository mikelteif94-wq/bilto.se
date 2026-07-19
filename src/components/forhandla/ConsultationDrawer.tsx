import { useEffect, useState } from 'react';
import {
  X, Check, Calendar, Clock, Phone, ArrowRight, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import type { Forhandlare } from '../../data/forhandlare';

interface ConsultationDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultForhandlare?: Forhandlare | null;
}

type Step = 0 | 1 | 2 | 3 | 4;
type Syfte = 'Köpa' | 'Sälja' | 'Inbyte' | 'Annat';

const SLOTS: { syfte: Syfte; desc: string }[] = [
  { syfte: 'Köpa', desc: 'Jag ska köpa en bil och vill ha hjälp att förhandla priset' },
  { syfte: 'Sälja', desc: 'Jag vill sälja min bil till bästa pris' },
  { syfte: 'Inbyte', desc: 'Jag ska byta in min bil mot en annan' },
  { syfte: 'Annat', desc: 'Jag har en annan fråga om en bilaffär' },
];

const TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
  }
  return out;
}

const DATES = nextDays(8);

function fmtDate(d: Date): string {
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function fmtDateLong(d: Date): string {
  return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ConsultationDrawer({
  open,
  onClose,
  defaultForhandlare,
}: ConsultationDrawerProps) {
  const [step, setStep] = useState<Step>(0);
  const [syfte, setSyfte] = useState<Syfte | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) {
      setStep(0);
      setSyfte(null);
      setDate(null);
      setTime(null);
      setName('');
      setPhone('');
      setEmail('');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  const canNext =
    (step === 0 && syfte) ||
    (step === 1 && date) ||
    (step === 2 && time) ||
    (step === 3 && name.trim() && phone.trim().length >= 5);

  const next = () => {
    if (step < 4 && canNext) setStep((step + 1) as Step);
  };
  const back = () => {
    if (step > 0) setStep((step - 1) as Step);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-[#17281f]/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md h-full bg-[#faf7f2] shadow-2xl flex flex-col animate-[slideInRight_0.25s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e2d6]">
          <div>
            <p className="fh-eyebrow">Kostnadsfri konsultation</p>
            <h2 className="font-display text-lg font-semibold mt-0.5">
              {step === 4 ? 'Bekräftat' : 'Boka samtal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#f1ece1] flex items-center justify-center transition"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="px-5 pt-4">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? 'bg-[#0e6b45]' : 'bg-[#e8e2d6]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-[#5a6b62] mb-4">Vad gäller ditt ärende?</p>
              {SLOTS.map((s) => (
                <button
                  key={s.syfte}
                  onClick={() => setSyfte(s.syfte)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    syfte === s.syfte
                      ? 'border-[#0e6b45] bg-[#0e6b45]/8 ring-2 ring-[#0e6b45]/15'
                      : 'border-[#e8e2d6] bg-white hover:border-[#d4ccb8]'
                  }`}
                >
                  <p className="font-semibold text-[#17281f]">{s.syfte}</p>
                  <p className="text-sm text-[#5a6b62] mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-[#5a6b62] mb-4">Vilken dag passar dig?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {DATES.map((d) => (
                  <button
                    key={d.toISOString()}
                    onClick={() => setDate(d)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      date?.toDateString() === d.toDateString()
                        ? 'border-[#0e6b45] bg-[#0e6b45]/8 ring-2 ring-[#0e6b45]/15'
                        : 'border-[#e8e2d6] bg-white hover:border-[#d4ccb8]'
                    }`}
                  >
                    <p className="text-xs text-[#9aa89e] capitalize">
                      {d.toLocaleDateString('sv-SE', { weekday: 'short' })}
                    </p>
                    <p className="font-semibold mt-0.5">{fmtDate(d)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-[#5a6b62] mb-4">
                {date ? fmtDateLong(date) : 'Välj en tid'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`p-3.5 rounded-2xl border font-medium transition-all flex items-center justify-center gap-2 ${
                      time === t
                        ? 'border-[#0e6b45] bg-[#0e6b45]/8 ring-2 ring-[#0e6b45]/15 text-[#0e6b45]'
                        : 'border-[#e8e2d6] bg-white hover:border-[#d4ccb8]'
                    }`}
                  >
                    <Clock className="w-4 h-4 opacity-60" />
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-[#5a6b62] mb-2">Hur når vi dig?</p>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">Namn</label>
                <input
                  className="fh-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="För- och efternamn"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">Telefon</label>
                <input
                  className="fh-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07X XXX XX XX"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">E-post (valfritt)</label>
                <input
                  className="fh-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@exempel.se"
                  inputMode="email"
                />
              </div>
              {defaultForhandlare && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0e6b45]/6 border border-[#0e6b45]/15">
                  <div className="w-10 h-10 rounded-full bg-[#0e6b45]/15 flex items-center justify-center font-semibold text-[#0e6b45]">
                    {defaultForhandlare.name.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{defaultForhandlare.name}</p>
                    <p className="text-xs text-[#5a6b62]">Förhandlare förvald</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#0e6b45] flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2">
                Tack{name ? `, ${name.split(' ')[0]}` : ''}!
              </h3>
              <p className="text-[#5a6b62] mb-6 leading-relaxed">
                {defaultForhandlare?.name ?? 'En förhandlare'} ringer dig inom 2 timmar.
                Därefter uppdragsavtal via BankID — <strong className="text-[#17281f]">0 kr tills affären blir av</strong>.
              </p>
              <div className="fh-card p-4 text-left text-sm space-y-2">
                <div className="flex justify-between"><span className="text-[#9aa89e]">Syfte</span><span className="font-medium">{syfte}</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Datum</span><span className="font-medium">{date ? fmtDateLong(date) : '–'}</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Tid</span><span className="font-medium">{time}</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Telefon</span><span className="font-medium">{phone}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div className="px-5 py-4 border-t border-[#e8e2d6] flex items-center gap-3">
            {step > 0 && (
              <button onClick={back} className="fh-btn-ghost !px-4 !py-3">
                <ArrowLeft className="w-4 h-4" />
                Tillbaka
              </button>
            )}
            <button
              onClick={next}
              disabled={!canNext}
              className="fh-btn flex-1"
            >
              {step === 3 ? 'Bekräfta' : 'Fortsätt'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {step === 4 && (
          <div className="px-5 py-4 border-t border-[#e8e2d6]">
            <button onClick={onClose} className="fh-btn w-full">
              Klart
            </button>
          </div>
        )}

        <div className="px-5 pb-4 flex items-center justify-center gap-1.5 text-xs text-[#9aa89e]">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ingen bindningstid. Du betalar bara om affären blir av.
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  );
}
