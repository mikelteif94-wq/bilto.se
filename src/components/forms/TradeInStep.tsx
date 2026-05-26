import { ArrowRight, Repeat, X } from 'lucide-react';

interface TradeInStepProps {
  onYes: () => void;
  onNo: () => void;
}

export default function TradeInStep({ onYes, onNo }: TradeInStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-slate-600 leading-[1.6]">
        Nu när du säljer — letar du efter en ny bil? Vi kan förhandla både köp och försäljning åt dig på samma gång.
      </p>

      <button
        type="button"
        onClick={onYes}
        className="group w-full text-left rounded-2xl border-2 border-[#0e6efe] bg-[#0e6efe]/[0.03] hover:bg-[#0e6efe]/[0.07] p-5 sm:p-6 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#0e6efe]/10 flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5 text-[#0e6efe]" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                Ja, jag vill byta bil
              </h3>
              <ArrowRight className="w-5 h-5 text-[#0e6efe] shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[14px] text-slate-500 leading-[1.5] mt-1">
              Vi hjälper dig hitta nästa bil och förhandlar både försäljning och köp.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onNo}
        className="group w-full text-left rounded-2xl border border-slate-200 bg-white hover:border-slate-300 p-5 sm:p-6 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-slate-400" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] font-semibold text-slate-700 tracking-tight">
                Nej, bara sälja
              </h3>
              <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[14px] text-slate-500 leading-[1.5] mt-1">
              Gå vidare och granska din anmälan.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
