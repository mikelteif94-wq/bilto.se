import { useState } from 'react';
import { Search, Handshake, ArrowLeftRight, ArrowRight, Phone, CheckSquare, HelpCircle, Check } from 'lucide-react';

export type BuyTrack = 'found' | 'searching' | 'know' | 'explore' | 'trade';

interface BuyTrackStepProps {
  initialBil?: string;
  onChoose: (track: BuyTrack) => void;
  onGuidance: () => void;
}

type MainChoice = 'found' | 'searching' | 'trade' | null;

const OptionButton = ({
  icon: Icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#0e6efe]/40 hover:bg-[#0e6efe]/[0.03] active:scale-[0.99] transition-all duration-150 text-left"
  >
    <div className="w-10 h-10 rounded-xl bg-[#faf8f5] group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
      <Icon className="w-5 h-5 text-slate-500 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-semibold text-slate-900 leading-snug">{title}</p>
      <p className="text-[12.5px] text-slate-400 mt-0.5 leading-snug">{sub}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0e6efe] group-hover:translate-x-0.5 transition-all shrink-0" />
  </button>
);

export default function BuyTrackStep({ initialBil, onChoose, onGuidance }: BuyTrackStepProps) {
  const [mainChoice, setMainChoice] = useState<MainChoice>(null);

  if (mainChoice === 'searching') {
    return (
      <div className="space-y-2.5">
        <div className="mb-5">
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 mb-1">
            Vet du vilken bil du vill ha?
          </h2>
          <p className="text-[13.5px] text-slate-500 leading-[1.55]">
            Det hjälper oss anpassa frågorna efter dig.
          </p>
        </div>

        <OptionButton
          icon={CheckSquare}
          title="Ja, jag vet vilken modell"
          sub="Märke, modell och ungefär vad du kan lägga."
          onClick={() => onChoose('know')}
        />

        <OptionButton
          icon={HelpCircle}
          title="Nej, jag är inte säker"
          sub="Berätta vad som är viktigt – vi hittar rätt bil."
          onClick={() => onChoose('explore')}
        />

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setMainChoice(null)}
            className="text-[13px] text-slate-400 hover:text-slate-700 transition-colors underline underline-offset-2"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[13.5px] text-slate-400 mb-5">Välj det som passar dig bäst.</p>

      <OptionButton
        icon={Handshake}
        title={initialBil ? `Jag har hittat en ${initialBil}` : 'Jag har hittat en bil'}
        sub="Vi förhandlar med säljaren åt dig och pressar priset."
        onClick={() => onChoose('found')}
      />

      <OptionButton
        icon={Search}
        title={initialBil ? `Jag letar efter en ${initialBil}` : 'Jag söker en bil'}
        sub="Vi hittar, kollar och förhandlar åt dig."
        onClick={() => initialBil ? onChoose('know') : setMainChoice('searching')}
      />

      <OptionButton
        icon={ArrowLeftRight}
        title="Jag vill byta in"
        sub="Vi sköter inbytet och hjälper dig hitta ny bil."
        onClick={() => onChoose('trade')}
      />

      <div className="pt-3">
        <button
          type="button"
          onClick={onGuidance}
          className="w-full flex items-center justify-center gap-2 text-[13px] text-slate-400 hover:text-[#0e6efe] transition-colors py-2.5 rounded-xl hover:bg-[#0e6efe]/[0.04] border border-transparent hover:border-[#0e6efe]/20"
        >
          <Phone className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Osäker? <span className="font-semibold">Vi ringer och guidar dig</span></span>
        </button>
      </div>

      <div className="mt-2 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Hur går det till?</p>
        <div className="space-y-2.5">
          {([
            { n: '1', title: 'Välj vad du behöver', desc: 'Berätta om din situation — hittat bil, letar, eller inbyte.' },
            { n: '2', title: 'Vi tar kontakt', desc: 'En bilexpert hör av sig och vi lägger upp en plan.' },
            { n: '3', title: 'Vi sköter det åt dig', desc: 'Förhandling, koll av bilen och hela köpprocessen.' },
          ] as const).map(item => (
            <div key={item.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#0e6efe]/8 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-[#0e6efe]">{item.n}</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-slate-800 leading-snug">{item.title}</div>
                <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([
            { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Kostnadsfritt' },
            { icon: Phone, color: 'text-[#0e6efe]',   bg: 'bg-blue-50',    label: 'Vi ringer dig' },
            { icon: Handshake, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Inga förpliktelser' },
          ] as const).map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1 text-center">
              <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} strokeWidth={2} />
              </div>
              <span className="text-[10.5px] font-medium text-slate-500 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
