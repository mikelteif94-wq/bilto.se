const KEY = 'bilto_via';

export function readAttribution(): string | null {
  return sessionStorage.getItem(KEY);
}

export function captureAttribution(): void {
  const params = new URLSearchParams(window.location.search);
  const via = params.get('via');
  if (via) sessionStorage.setItem(KEY, via);
}

export function clearAttribution(): void {
  sessionStorage.removeItem(KEY);
}
