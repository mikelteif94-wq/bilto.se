import { useEffect, useState, useRef } from 'react';
import { Trash2, Loader2, Trophy, Gavel, Check, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Bid {
  id: string;
  car_id: string;
  dealer_id: string;
  belopp: number;
  kommentar: string;
  status: string;
  created_at: string;
  dealers: {
    id: string;
    foretagsnamn: string;
    kontaktperson: string;
    telefon: string;
    mejl: string;
  } | null;
}

interface BidsPanelProps {
  carId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  winningBidId: string | null;
  carStatus: string;
  onChanged?: () => void;
}

function formatKr(v: number) {
  return v.toLocaleString('sv-SE');
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_LABELS: Record<string, string> = {
  aktivt: 'Aktivt',
  vunnit: 'Vinnande',
  avslaget: 'Avslaget',
};

const STATUS_COLORS: Record<string, string> = {
  aktivt: 'bg-blue-50 text-blue-700 ring-blue-200',
  vunnit: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  avslaget: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export default function BidsPanel({
  carId,
  customerName,
  customerEmail,
  customerPhone,
  winningBidId,
  carStatus,
  onChanged,
}: BidsPanelProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [newBidFlash, setNewBidFlash] = useState(false);
  const prevCountRef = useRef<number>(0);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bids')
      .select('*, dealers(id, foretagsnamn, kontaktperson, telefon, mejl)')
      .eq('car_id', carId)
      .order('belopp', { ascending: false });
    const newBids = (data ?? []) as Bid[];
    if (prevCountRef.current > 0 && newBids.length > prevCountRef.current) {
      setNewBidFlash(true);
      setTimeout(() => setNewBidFlash(false), 3000);
    }
    prevCountRef.current = newBids.length;
    setBids(newBids);
    setLoading(false);
  };

  useEffect(() => {
    void load();

    const channel = supabase
      .channel(`bids:car_id=eq.${carId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids', filter: `car_id=eq.${carId}` },
        () => { void load(); }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [carId]);

  const deleteBid = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    await supabase.from('bids').delete().eq('id', id);
    if (id === winningBidId) {
      await supabase
        .from('cars')
        .update({ vinnande_bud_id: null })
        .eq('id', carId);
    }
    await load();
    setBusyId(null);
    onChanged?.();
  };

  const approveBid = async (bid: Bid) => {
    if (approvingId) return;
    setApprovingId(bid.id);
    await supabase
      .from('bids')
      .update({ status: 'avslaget' })
      .eq('car_id', carId)
      .neq('id', bid.id);
    await supabase
      .from('bids')
      .update({ status: 'vunnit' })
      .eq('id', bid.id);
    await supabase
      .from('cars')
      .update({
        vinnande_bud_id: bid.id,
        status: 'auktion_avslutad',
      })
      .eq('id', carId);

    await supabase.from('car_activities').insert({
      car_id: carId,
      type: 'status_change',
      title: `Vinnande bud godkänt – ${bid.belopp.toLocaleString('sv-SE')} kr`,
      body: `Handlare: ${bid.dealers?.foretagsnamn ?? 'Okänd'}`,
      data: { bid_id: bid.id, amount: bid.belopp, dealer_id: bid.dealer_id },
      source: 'admin',
      actor_type: 'admin',
    });

    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-bid-approved`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ car_id: carId }),
        },
      );
    } catch {
      // best-effort
    }

    await load();
    setApprovingId(null);
    onChanged?.();
  };

  const clearAll = async () => {
    if (clearing) return;
    setClearing(true);
    await supabase.from('bids').delete().eq('car_id', carId);
    await supabase
      .from('cars')
      .update({ vinnande_bud_id: null })
      .eq('id', carId);
    await load();
    setClearing(false);
    setConfirmClear(false);
    onChanged?.();
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-900">
            Inkomna bud {!loading && <span className="text-slate-400 text-base font-medium">({bids.length})</span>}
          </h2>
          {newBidFlash && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold animate-pulse">
              <Zap className="w-3 h-3" /> Nytt bud!
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live
          </span>
        </div>
        {bids.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Säker?</span>
              <button
                onClick={clearAll}
                disabled={clearing}
                className="h-8 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-60"
              >
                {clearing && <Loader2 className="w-3 h-3 animate-spin" />}
                Rensa alla
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="h-8 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-[#faf8f5] transition"
              >
                Avbryt
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="h-8 px-3 rounded-xl border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Rensa alla bud
            </button>
          )
        )}
      </div>

      <div className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 mb-4">
        Säljare: <span className="font-semibold text-slate-700">{customerName || '–'}</span>
        {customerPhone ? <> · {customerPhone}</> : null}
        {customerEmail ? <> · {customerEmail}</> : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : bids.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">Inga bud än.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {bids.map((bid) => {
            const isWinner = bid.id === winningBidId || bid.status === 'vunnit';
            return (
              <li key={bid.id} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-slate-900 text-base">
                      {formatKr(bid.belopp)} kr
                    </span>
                    {isWinner && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200">
                        <Trophy className="w-3 h-3" /> Vinnande
                      </span>
                    )}
                    {!isWinner && bid.status && (
                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-xl ring-1 ring-inset ${
                          STATUS_COLORS[bid.status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                      >
                        {STATUS_LABELS[bid.status] ?? bid.status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {bid.dealers?.foretagsnamn ?? 'Okänd handlare'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {bid.dealers?.kontaktperson ? `${bid.dealers.kontaktperson} · ` : ''}
                    {bid.dealers?.telefon ? `${bid.dealers.telefon} · ` : ''}
                    {bid.dealers?.mejl}
                  </div>
                  {bid.kommentar && (
                    <div className="text-xs text-slate-600 mt-1 italic">"{bid.kommentar}"</div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-1">
                    {formatDateTime(bid.created_at)}
                  </div>
                </div>
                {!isWinner && (
                  <button
                    onClick={() => approveBid(bid)}
                    disabled={approvingId === bid.id || !!busyId}
                    className="shrink-0 h-8 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-60"
                    title="Godkänn budet och meddela handlaren"
                  >
                    {approvingId === bid.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Godkänn
                  </button>
                )}
                <button
                  onClick={() => deleteBid(bid.id)}
                  disabled={busyId === bid.id}
                  className="shrink-0 w-8 h-8 rounded-full border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition flex items-center justify-center disabled:opacity-60"
                  title="Ta bort budet"
                >
                  {busyId === bid.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {carStatus === 'auktion_avslutad' && (
        <p className="text-[11px] text-slate-400 mt-4">
          Auktionen är avslutad. Att ta bort vinnande bud återställer kopplingen till bilen.
        </p>
      )}
    </div>
  );
}
