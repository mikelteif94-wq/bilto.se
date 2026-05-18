import { Star, Snowflake, Shield, Truck, TrendingDown, Percent, CreditCard, Gift } from 'lucide-react';

interface Offer {
  id: string;
  car_description: string;
  original_price: number;
  negotiated_price: number;
  original_interest_rate: number | null;
  negotiated_interest_rate: number | null;
  original_monthly_cost: number | null;
  negotiated_monthly_cost: number | null;
  winter_tires_included: boolean;
  winter_tires_value: number;
  warranty_included: boolean;
  warranty_years: number;
  warranty_value: number;
  home_delivery_included: boolean;
  home_delivery_value: number;
  other_savings_description: string;
  other_savings_value: number;
  total_savings: number;
  total_deal_price: number;
  deal_rating: string;
  admin_comment: string;
  sent_at: string | null;
}

const RATING_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  good: { label: 'Bra deal', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  great: { label: 'Mycket bra deal', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  excellent: { label: 'Fantastisk deal', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function CustomerOfferCard({ offer }: { offer: Offer }) {
  const rating = RATING_CONFIG[offer.deal_rating] || RATING_CONFIG.good;
  const priceDiff =
    offer.original_price > 0 && offer.negotiated_price > 0
      ? offer.original_price - offer.negotiated_price
      : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0e6efe] to-[#3d8cff] px-5 sm:px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
              Ditt erbjudande
            </p>
            <h3 className="text-white text-lg sm:text-xl font-bold leading-tight">
              {offer.car_description || 'Biloffer'}
            </h3>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${rating.bg} ${rating.text}`}
          >
            <Star className="w-3 h-3" />
            {rating.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 sm:px-6 py-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Vad Bilto förhandlat fram
        </p>

        <div className="divide-y divide-slate-100">
          {/* Price */}
          {priceDiff > 0 && (
            <OfferRow
              icon={TrendingDown}
              label="Prisrabatt"
              originalValue={`${offer.original_price.toLocaleString('sv-SE')} kr`}
              newValue={`${offer.negotiated_price.toLocaleString('sv-SE')} kr`}
              savings={`-${priceDiff.toLocaleString('sv-SE')} kr`}
            />
          )}

          {/* Interest rate */}
          {offer.original_interest_rate != null && offer.negotiated_interest_rate != null && (
            <OfferRow
              icon={Percent}
              label="Ränta"
              originalValue={`${offer.original_interest_rate}%`}
              newValue={`${offer.negotiated_interest_rate}%`}
              savings="Nedförhandlad"
            />
          )}

          {/* Monthly cost */}
          {offer.original_monthly_cost != null && offer.negotiated_monthly_cost != null && (
            <OfferRow
              icon={CreditCard}
              label="Manadskostnad"
              originalValue={`${offer.original_monthly_cost.toLocaleString('sv-SE')} kr/man`}
              newValue={`${offer.negotiated_monthly_cost.toLocaleString('sv-SE')} kr/man`}
              savings={
                offer.original_monthly_cost - offer.negotiated_monthly_cost > 0
                  ? `-${(offer.original_monthly_cost - offer.negotiated_monthly_cost).toLocaleString('sv-SE')} kr/man`
                  : undefined
              }
            />
          )}

          {/* Winter tires */}
          {offer.winter_tires_included && (
            <ExtraRow
              icon={Snowflake}
              label="Vinterdack"
              value={offer.winter_tires_value}
              badge="Forhandlat in"
            />
          )}

          {/* Warranty */}
          {offer.warranty_included && (
            <ExtraRow
              icon={Shield}
              label={`Garanti${offer.warranty_years ? ` ${offer.warranty_years} ar` : ''}`}
              value={offer.warranty_value}
              badge="Forhandlat in"
            />
          )}

          {/* Home delivery */}
          {offer.home_delivery_included && (
            <ExtraRow
              icon={Truck}
              label="Hemleverans"
              value={offer.home_delivery_value}
              badge="Gratis"
            />
          )}

          {/* Other */}
          {offer.other_savings_value > 0 && (
            <ExtraRow
              icon={Gift}
              label={offer.other_savings_description || 'Ovrigt'}
              value={offer.other_savings_value}
              badge="Ingar"
            />
          )}
        </div>

        {/* Total savings */}
        {offer.total_savings > 0 && (
          <div className="mt-4 px-4 py-4 rounded-xl bg-[#0e6efe]/5 border border-[#0e6efe]/15">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#0e6efe]">Total besparing</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#0e6efe] tabular-nums">
                ~{offer.total_savings.toLocaleString('sv-SE')} kr
              </span>
            </div>
          </div>
        )}

        {/* Deal price */}
        {offer.total_deal_price > 0 && (
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-slate-500">Totalt dealpris</span>
            <span className="text-lg font-bold text-slate-900">
              {offer.total_deal_price.toLocaleString('sv-SE')} kr
            </span>
          </div>
        )}

        {/* Monthly after */}
        {offer.negotiated_monthly_cost != null && offer.negotiated_monthly_cost > 0 && (
          <div className="mt-1 flex items-baseline justify-between text-sm">
            <span className="text-slate-500">Manadskostnad</span>
            <span className="text-base font-semibold text-slate-900">
              {offer.negotiated_monthly_cost.toLocaleString('sv-SE')} kr/man
            </span>
          </div>
        )}

        {/* Admin comment */}
        {offer.admin_comment && (
          <div className="mt-5 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Biltos bedomning
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {offer.admin_comment}
            </p>
          </div>
        )}

        {offer.sent_at && (
          <p className="mt-4 text-xs text-slate-400 text-center">
            Skickat{' '}
            {new Date(offer.sent_at).toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function OfferRow({
  icon: Icon,
  label,
  originalValue,
  newValue,
  savings,
}: {
  icon: typeof TrendingDown;
  label: string;
  originalValue: string;
  newValue: string;
  savings?: string;
}) {
  return (
    <div className="py-3 sm:py-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <div className="flex items-baseline gap-3 pl-6">
        <span className="text-sm text-slate-400 line-through">{originalValue}</span>
        <span className="text-sm font-bold text-slate-900">{newValue}</span>
        {savings && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {savings}
          </span>
        )}
      </div>
    </div>
  );
}

function ExtraRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: typeof Snowflake;
  label: string;
  value: number;
  badge: string;
}) {
  return (
    <div className="py-3 sm:py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {value > 0 && (
          <span className="text-xs text-slate-400">(varde {value.toLocaleString('sv-SE')} kr)</span>
        )}
      </div>
      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    </div>
  );
}
