import { useState } from 'react';
import { Search, Handshake, ArrowLeftRight, ArrowRight, Phone, HelpCircle, CheckCircle2 } from 'lucide-react';

export type BuyTrack = 'found' | 'searching' | 'know' | 'explore' | 'trade';

interface BuyTrackStepProps {
  initialBil?: string;
  onChoose: (track: BuyTrack) => void;
  onGuidance: () => void;
}

type MainChoice = 'found' | 'searching' | 'trade' | null;

const Card = ({
  onClick,
  icon,
  label,
  description,
  index,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  index: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl p-5 transition-all duration-200 active:scale-[0.98]"
  >
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-xl bg-white/8 group-hover:bg-[#0e6efe]/20 border border-white/10 group-hover:border-[#0e6efe]/40 flex items-center justify-center transition-all duration-200">
          {icon}
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center text-[10px] font-bold text-slate-400">
          {index}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold text-white leading-snug">{label}</p>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
        <p className="text-[13px] text-slate-400 mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  </button>
);

export default function BuyTrackStep({ initialBil, onChoose, onGuidance }: BuyTrackStepProps) {
  const [mainChoice, setMainChoice] = useState<MainChoice>(null);

  if (mainChoice === 'searching') {
    return (
      <div className="space-y-3">
        <div className="mb-6">
          <p className="text-[15px] font-semibold text-white mb-1">Vet du vilken bil du vill ha?</p>
          <p className="text-[13.5px] text-slate-400">Det hjälper oss anpassa frågorna efter dig.</p>
        </div>

        <Card
          onClick={() => onChoose('know')}
          icon={<CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-[#60a5fa] transition-colors" strokeWidth={2} />}
          label="Ja, jag vet vilken modell"
          description="Märke, modell och ungefär vad du kan lägga."
          index={1}
        />

        <Card
          onClick={() => onChoose('explore')}
          icon={<HelpCircle className="w-5 h-5 text-slate-300 group-hover:text-[#60a5fa] transition-colors" strokeWidth={2} />}
          label="Nej, jag är inte säker"
          description="Berätta vad som är viktigt — vi hittar rätt bil."
          index={2}
        />

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setMainChoice(null)}
            className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-slate-400 mb-5">Välj det alternativ som stämmer in på dig.</p>

      <Card
        onClick={() => onChoose('found')}
        icon={<Handshake className="w-5 h-5 text-slate-300 group-hover:text-[#60a5fa] transition-colors" strokeWidth={2} />}
        label={initialBil ? `Jag har hittat en ${initialBil}` : 'Jag har hittat en bil'}
        description="Vi förhandlar med säljaren åt dig och pressar priset."
        index={1}
      />

      <Card
        onClick={() => setMainChoice('searching')}
        icon={<Search className="w-5 h-5 text-slate-300 group-hover:text-[#60a5fa] transition-colors" strokeWidth={2} />}
        label={initialBil ? `Jag letar efter en ${initialBil}` : 'Jag söker en bil'}
        description="Vi hittar, kollar och förhandlar åt dig."
        index={2}
      />

      <Card
        onClick={() => onChoose('trade')}
        icon={<ArrowLeftRight className="w-5 h-5 text-slate-300 group-hover:text-[#60a5fa] transition-colors" strokeWidth={2} />}
        label="Jag vill byta in"
        description="Vi sköter inbytet och hjälper dig hitta ny bil."
        index={3}
      />

      <div className="pt-4">
        <button
          type="button"
          onClick={onGuidance}
          className="w-full flex items-center justify-center gap-2 text-[13px] text-slate-500 hover:text-slate-300 transition-colors py-2.5 rounded-xl hover:bg-white/5"
        >
          <Phone className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Osäker? <span className="font-semibold text-slate-400">Vi ringer och guidar dig</span></span>
        </button>
      </div>
    </div>
  );
}
