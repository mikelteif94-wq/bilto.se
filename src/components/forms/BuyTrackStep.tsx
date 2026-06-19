import { useState } from 'react';
import { Search, Handshake, ArrowLeftRight, ArrowRight, Phone, HelpCircle, CheckSquare } from 'lucide-react';

export type BuyTrack = 'found' | 'searching' | 'know' | 'explore' | 'trade';

interface BuyTrackStepProps {
  initialBil?: string;
  onChoose: (track: BuyTrack) => void;
  onGuidance: () => void;
}

type MainChoice = 'found' | 'searching' | 'trade' | null;

export default function BuyTrackStep({ initialBil, onChoose, onGuidance }: BuyTrackStepProps) {
  const [mainChoice, setMainChoice] = useState<MainChoice>(null);

  if (mainChoice === 'searching') {
    return (
      <div className="space-y-3">
        <div className="mb-5">
          <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 mb-1">
            Vet du vilken bil du vill ha?
          </h2>
          <p className="text-[14.5px] text-slate-500 leading-[1.55]">
            Det hjälper oss anpassa frågorna efter dig.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChoose('know')}
          className="group w-full text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
              <CheckSquare className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[16px] font-semibold text-slate-900">
                  Ja, jag vet vilken modell
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[13.5px] text-slate-500 mt-0.5">
                Märke, modell och ungefär vad du kan lägga.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChoose('explore')}
          className="group w-full text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
              <HelpCircle className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[16px] font-semibold text-slate-900">
                  Nej, jag är inte säker
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[13.5px] text-slate-500 mt-0.5">
                Berätta vad som är viktigt — vi hittar rätt bil.
              </p>
            </div>
          </div>
        </button>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setMainChoice(null)}
            className="text-[13.5px] text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-2"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] text-slate-500 mb-5">Välj det som passar dig bäst.</p>

      <button
        type="button"
        onClick={() => onChoose('found')}
        className="group w-full text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all duration-150"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
            <Handshake className="w-5 h-5 text-slate-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-semibold text-slate-900">
                {initialBil ? `Jag har hittat en ${initialBil}` : 'Jag har hittat en bil'}
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[13.5px] text-slate-500 mt-0.5">
              Vi förhandlar med säljaren åt dig och pressar priset.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => setMainChoice('searching')}
        className="group w-full text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all duration-150"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
            <Search className="w-5 h-5 text-slate-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-semibold text-slate-900">
                {initialBil ? `Jag letar efter en ${initialBil}` : 'Jag söker en bil'}
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[13.5px] text-slate-500 mt-0.5">
              Vi hittar, kollar och förhandlar åt dig.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChoose('trade')}
        className="group w-full text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-400 hover:shadow-sm active:scale-[0.99] transition-all duration-150"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
            <ArrowLeftRight className="w-5 h-5 text-slate-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-semibold text-slate-900">
                Jag vill byta in
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[13.5px] text-slate-500 mt-0.5">
              Vi sköter inbytet och hjälper dig hitta ny bil.
            </p>
          </div>
        </div>
      </button>

      <div className="pt-3">
        <button
          type="button"
          onClick={onGuidance}
          className="w-full flex items-center justify-center gap-2 text-[13.5px] text-slate-500 hover:text-slate-900 transition-colors py-2.5 rounded-lg hover:bg-slate-100"
        >
          <Phone className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Osäker? <span className="font-semibold">Vi ringer och guidar dig</span></span>
        </button>
      </div>
    </div>
  );
}
