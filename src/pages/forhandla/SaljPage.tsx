import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Camera, Car, Upload, User, X,
} from 'lucide-react';
import ForhandlaLayout from '../../components/forhandla/ForhandlaLayout';

interface SaljPageProps {
  onNavigate: (path: string) => void;
  onOpenConsultation: () => void;
  activePath: string;
}

type Step = 0 | 1 | 2 | 3 | 4;

const SKICK_OPTIONS = [
  { value: 'ny', label: 'Ny — obegagnad' },
  { value: 'bra', label: 'Bra skick' },
  { value: 'normalt', label: 'Normalt slitage' },
  { value: 'dåligt', label: 'Dåligt skick' },
];

const UTRUSTNING = [
  'Vinterdäck', 'Sommerdäck', 'Dragkrok', 'Pansarat glas',
  'Navigation', 'Backkamera', 'Läderklädsel', 'Panoramtak',
  'El-stol', 'Värmesäten', 'Apple CarPlay', 'Adaptiv farthållare',
];

export default function SaljPage({ onNavigate, onOpenConsultation, activePath }: SaljPageProps) {
  const [step, setStep] = useState<Step>(0);
  const [skick, setSkick] = useState<string | null>(null);
  const [utrustning, setUtrustning] = useState<string[]>([]);
  const [bilder, setBilder] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reg, setReg] = useState('');

  const toggleUtrustning = (u: string) => {
    setUtrustning((prev) => prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]);
  };

  const canNext =
    (step === 0 && skick) ||
    (step === 1) ||
    (step === 2) ||
    (step === 3 && name.trim() && phone.trim().length >= 5);

  const next = () => { if (step < 4 && canNext) setStep((step + 1) as Step); };
  const back = () => { if (step > 0) setStep((step - 1) as Step); };

  const steps = ['Bilskick', 'Utrustning', 'Bilder', 'Kontakt', 'Klart'];

  return (
    <ForhandlaLayout onNavigate={onNavigate} onOpenConsultation={onOpenConsultation} activePath={activePath}>
      <section className="fh-max fh-section-pad pt-6 pb-14">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-sm text-[#5a6b62] hover:text-[#0e6b45] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka
        </button>

        <div className="mb-8">
          <p className="fh-eyebrow mb-2">SÄLJ DIN BIL</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            Låt granskade handlare bjuda på din bil
          </h1>
          <p className="mt-3 text-[#5a6b62] max-w-xl">
            Du väljer bästa budet, betalt inom 1–3 dagar, noll tvång.
          </p>
        </div>

        {/* Stepper */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {steps.slice(0, 4).map((s, i) => (
              <div key={s} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition ${
                  i === step ? 'bg-[#0e6b45] text-white' :
                  i < step ? 'bg-[#0e6b45]/12 text-[#0e6b45]' :
                  'bg-[#f3eee4] text-[#9aa89e]'
                }`}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                    {i < step ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                  </span>
                  {s}
                </div>
                {i < 3 && <div className="w-4 h-px bg-[#e8e2d6]" />}
              </div>
            ))}
          </div>
        )}

        <div className="fh-card p-6 md:p-8 max-w-2xl">
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">Hur är bilens skick?</h2>
              <p className="text-sm text-[#5a6b62] mb-5">Ärlig bedömning ger ärliga bud.</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {SKICK_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSkick(s.value)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      skick === s.value
                        ? 'border-[#0e6b45] bg-[#0e6b45]/8 ring-2 ring-[#0e6b45]/15'
                        : 'border-[#e8e2d6] bg-white hover:border-[#d4ccb8]'
                    }`}
                  >
                    <Car className="w-5 h-5 mb-2 text-[#0e6b45]" />
                    <p className="font-medium">{s.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">Vilken utrustning har bilen?</h2>
              <p className="text-sm text-[#5a6b62] mb-5">Välj allt som ingår — det ökar värdet.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {UTRUSTNING.map((u) => (
                  <button
                    key={u}
                    onClick={() => toggleUtrustning(u)}
                    className={`p-3 rounded-2xl border text-sm font-medium transition-all flex items-center gap-2 ${
                      utrustning.includes(u)
                        ? 'border-[#0e6b45] bg-[#0e6b45]/8 text-[#0e6b45]'
                        : 'border-[#e8e2d6] bg-white hover:border-[#d4ccb8]'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center ${
                      utrustning.includes(u) ? 'bg-[#0e6b45] text-white' : 'border border-[#e8e2d6]'
                    }`}>
                      {utrustning.includes(u) && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    {u}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#9aa89e] mt-4">
                {utrustning.length} valda
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">Ladda upp bilder</h2>
              <p className="text-sm text-[#5a6b62] mb-5">
                Minst 3 bilder: främre, bakre och instrumentpanel. Du kan hoppa över detta steg.
              </p>
              <div className="border-2 border-dashed border-[#e8e2d6] rounded-2xl p-8 text-center hover:border-[#0e6b45]/40 transition">
                <Camera className="w-10 h-10 mx-auto text-[#9aa89e] mb-3" />
                <p className="text-sm font-medium mb-1">Dra bilder hit eller klicka för att välja</p>
                <p className="text-xs text-[#9aa89e] mb-4">JPG, PNG upp till 10 MB per bild</p>
                <button
                  onClick={() => setBilder((prev) => [...prev, `placeholder-${prev.length}.jpg`])}
                  className="fh-btn-ghost !py-2.5 !text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Välj bilder
                </button>
              </div>
              {bilder.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {bilder.map((b, i) => (
                    <div key={i} className="relative aspect-square rounded-xl bg-[#f3eee4] flex items-center justify-center">
                      <Camera className="w-6 h-6 text-[#9aa89e]" />
                      <button
                        onClick={() => setBilder((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#17281f]/60 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold mb-1">Hur når vi dig?</h2>
              <p className="text-sm text-[#5a6b62] mb-4">Bud skickas inom 24 timmar.</p>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">Regnummer</label>
                <input className="fh-input" value={reg} onChange={(e) => setReg(e.target.value)} placeholder="ABC 123" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">Namn</label>
                <input className="fh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="För- och efternamn" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">Telefon</label>
                <input className="fh-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X XXX XX XX" inputMode="tel" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5a6b62] mb-1.5 block">E-post</label>
                <input className="fh-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="namn@exempel.se" inputMode="email" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#0e6b45] flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">
                Tack{name ? `, ${name.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-[#5a6b62] mb-6 leading-relaxed max-w-md mx-auto">
                Granskade handlare bjuder på din bil — du väljer bästa budet,
                betalt inom 1–3 dagar, noll tvång.
              </p>
              <div className="fh-card p-4 text-left text-sm space-y-2 mb-6">
                <div className="flex justify-between"><span className="text-[#9aa89e]">Regnummer</span><span className="font-medium">{reg || '–'}</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Skick</span><span className="font-medium">{SKICK_OPTIONS.find((s) => s.value === skick)?.label ?? '–'}</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Utrustning</span><span className="font-medium">{utrustning.length} valda</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Bilder</span><span className="font-medium">{bilder.length} st</span></div>
                <div className="flex justify-between"><span className="text-[#9aa89e]">Telefon</span><span className="font-medium">{phone}</span></div>
              </div>
              <p className="text-xs text-[#9aa89e] mb-5">
                Vi hör av oss inom 24 timmar med dina första bud.
              </p>
              <button onClick={() => onNavigate('/')} className="fh-btn w-full">
                Tillbaka till startsidan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer nav */}
          {step < 4 && (
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#f1ece1]">
              {step > 0 && (
                <button onClick={back} className="fh-btn-ghost !px-4 !py-3">
                  <ArrowLeft className="w-4 h-4" />
                  Tillbaka
                </button>
              )}
              <button onClick={next} disabled={!canNext} className="fh-btn flex-1">
                {step === 3 ? 'Skicka in' : 'Fortsätt'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="fh-card p-4 mt-4 flex items-start gap-3 bg-[#0e6b45]/4 border-[#0e6b45]/15 max-w-2xl">
          <User className="w-5 h-5 text-[#0e6b45] mt-0.5 shrink-0" />
          <p className="text-sm text-[#17281f]">
            Vill du hellre ha en förhandlare som hanterar hela försäljningen?
            <button onClick={onOpenConsultation} className="font-semibold text-[#0e6b45] underline ml-1">
              Boka kostnadsfri konsultation
            </button>
          </p>
        </div>
      </section>
    </ForhandlaLayout>
  );
}
