export const SKICK_LABELS: Record<string, string> = {
  mycket_bra: 'Mycket bra',
  bra: 'Bra',
  okej: 'Okej',
  ok: 'OK',
  slitet: 'Slitet',
  skadat: 'Skadat',
  utmärkt: 'Utmärkt',
};

export function formatKr(v: number): string {
  return v.toLocaleString('sv-SE');
}

export function formatTimeLeftSimple(endIso: string | null, now: number): string {
  if (!endIso) return '—';
  const diff = new Date(endIso).getTime() - now;
  if (diff <= 0) return 'Slut';
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${m}m`;
  return `${m}m`;
}

export function formatTimeLeftDetailed(endIso: string | null, now: number): { label: string; ended: boolean; warn: boolean } {
  if (!endIso) return { label: 'Ingen sluttid', ended: false, warn: false };
  const end = new Date(endIso).getTime();
  const diff = end - now;
  if (diff <= 0) return { label: 'Auktionen är slut', ended: true, warn: false };
  const secs = Math.floor(diff / 1000);
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const label =
    days > 0
      ? `${days}d ${pad(hours)}h ${pad(mins)}m`
      : `${pad(hours)}h ${pad(mins)}m ${pad(s)}s`;
  return { label, ended: false, warn: diff < 2 * 60 * 60 * 1000 };
}
