// Lightweight, dependency-free browser fingerprint used to deduplicate likes.
// It is NOT identity — just a stable-ish per-browser id that survives clearing
// cookies/localStorage (recomputed from device signals). Proportional anti-abuse.

let cached: string | null = null;

function canvasSignal(): string {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 30);
    ctx.fillStyle = '#069';
    ctx.fillText('Gifmage✿語', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('Gifmage✿語', 4, 17);
    return c.toDataURL();
  } catch {
    return '';
  }
}

async function sha256hex(s: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return 'f' + (h >>> 0).toString(16).padStart(8, '0');
  }
}

/** Returns a stable browser id (hex). Cached in-memory and localStorage. */
export async function getVisitorId(): Promise<string> {
  if (cached) return cached;
  if (typeof window === 'undefined') return '';

  try {
    const stored = localStorage.getItem('gfp_vid');
    if (stored) { cached = stored; return stored; }
  } catch { /* ignore */ }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const signals = [
    nav.userAgent,
    nav.language,
    (nav.languages || []).join(','),
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency ?? '',
    nav.deviceMemory ?? '',
    canvasSignal(),
  ].join('||');

  const id = await sha256hex(signals);
  cached = id;
  try { localStorage.setItem('gfp_vid', id); } catch { /* ignore */ }
  return id;
}
