import { Phone, ArrowRight, Repeat } from 'lucide-react';

interface TrackChoiceStepProps {
  regnummer: string;
  miltal: number;
  onChoose: (track: 'auction') => void;
  onGuidance: () => void;
  onNavigateTrade?: () => void;
}

export default function TrackChoiceStep({ regnummer, miltal, onChoose, onGuidance, onNavigateTrade }: TrackChoiceStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-5">
        <div className="flex-1 min-w-0">
          <label className="block text-[16px] sm:text-[17px] font-bold text-slate-900 mb-3">
            Din bil
          </label>
          <div className="inline-flex items-center h-10 px-4 bg-[#0e6efe]/10 text-[#0e6efe] font-semibold text-[14px] rounded-md">
            <span className="tracking-widest">{regnummer}</span>
            {miltal > 0 && (
              <>
                <span className="mx-2 text-[#0e6efe]/40">&middot;</span>
                <span>{miltal.toLocaleString('sv-SE')} mil</span>
              </>
            )}
          </div>
        </div>
        <img
          src="/certified-pre-own.75373bb7.svg"
          alt=""
          aria-hidden="true"
          className="hidden sm:block w-24 h-24 object-contain shrink-0"
        />
      </div>

      <div>
        <p className="text-[15px] text-slate-600 leading-[1.55]">
          Vi f&ouml;resl&aring;r maxpris &mdash; du kan annars s&auml;lja direkt.
        </p>
      </div>

      {onNavigateTrade && (
        <button
          type="button"
          onClick={onNavigateTrade}
          className="group relative w-full text-left rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 hover:border-[#0e6efe] hover:bg-[#0e6efe]/[0.03] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-[#0e6efe]/10 flex items-center justify-center shrink-0 transition-colors">
              <Repeat className="w-5 h-5 text-slate-600 group-hover:text-[#0e6efe] transition-colors" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-slate-900 tracking-tight">
                  Jag vill byta bil
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[14.5px] text-slate-600 leading-[1.55] mt-1.5">
                Vi hj&auml;lper dig hitta n&auml;sta bil och f&ouml;rhandlar b&aring;de f&ouml;rs&auml;ljning och k&ouml;p.
              </p>
            </div>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={() => onChoose('auction')}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full border border-slate-300 text-[15px] font-semibold text-slate-700 hover:border-[#0e6efe] hover:text-[#0e6efe] transition-colors"
      >
        Jag vill s&auml;lja direkt
      </button>

      <div className="pt-2">
        <button
          type="button"
          onClick={onGuidance}
          className="w-full flex items-center justify-center gap-2 text-[14px] text-slate-600 hover:text-[#0e6efe] transition-colors py-2"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          <span>Os&auml;ker? <span className="font-semibold underline underline-offset-2">Vi ringer och guidar dig</span></span>
        </button>
      </div>
    </div>
  );
}
