interface FinancingCalcProps {
  carPrice: number;
}

function calcMonthly(carPrice: number): number {
  const kontantinsats = carPrice * 0.20;
  const avgift = carPrice * 0.01;
  const loan = carPrice - kontantinsats + avgift;
  const residual = carPrice * 0.55;
  const r = 0.0649 / 12;
  const n = 36;
  return ((loan - residual / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n));
}

export default function FinancingCalc({ carPrice }: FinancingCalcProps) {
  if (!carPrice || carPrice < 50000) return null;

  const monthly = calcMonthly(carPrice);
  const formatted = Math.round(monthly).toLocaleString('sv-SE');

  return (
    <div className="mt-3 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[#0e6efe]/10 border border-[#0e6efe]/20">
      <div className="w-1.5 h-1.5 rounded-full bg-[#0e6efe]" />
      <span className="text-[13px] text-slate-600">Finansiering ca</span>
      <span className="text-[14px] font-bold text-[#0e6efe]">{formatted} kr/mån</span>
      <span className="text-[11px] text-slate-400">· baserat på marknadsränta</span>
    </div>
  );
}
