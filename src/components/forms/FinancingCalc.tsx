interface FinancingCalcProps {
  carPrice: number;
}

function calcMonthly(carPrice: number) {
  const kontantinsats = carPrice * 0.20;
  const avgift = carPrice * 0.01;
  const loan = carPrice - kontantinsats + avgift;
  const residual = carPrice * 0.55;
  const r = 0.0649 / 12;
  const n = 36;
  const monthly = ((loan - residual / Math.pow(1 + r, n)) * r) / (1 - Math.pow(1 + r, -n));
  return { kontantinsats, avgift, loan, residual, monthly };
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('sv-SE') + ' kr';
}

export default function FinancingCalc({ carPrice }: FinancingCalcProps) {
  if (!carPrice || carPrice < 50000) return null;

  const { kontantinsats, avgift, loan, residual, monthly } = calcMonthly(carPrice);

  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-blue-100 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0e6efe]" />
        <span className="text-[13px] font-semibold text-[#0e6efe]">Finansieringsexempel</span>
        <span className="ml-auto text-[11px] text-slate-500">6,49% ränta · 36 mån · 20% insats</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <Row label="Bilpris" value={fmt(carPrice)} />
        <Row label="Kontantinsats (20%)" value={fmt(kontantinsats)} />
        <Row label="Avgift (1%)" value={fmt(avgift)} />
        <Row label="Lånesumma" value={fmt(loan)} />
        <Row label="Restvärde (55%)" value={fmt(residual)} />
        <Row label="Ränta" value="6,49%" />
      </div>
      <div className="px-4 py-3 bg-[#0e6efe] flex items-center justify-between">
        <span className="text-[13px] font-semibold text-white/90">Månadskostnad</span>
        <span className="text-[18px] font-bold text-white">ca {fmt(monthly)}/mån</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-[12.5px] font-medium text-slate-800">{value}</span>
    </div>
  );
}
