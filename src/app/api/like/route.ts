import { toggleLike } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const SALT = process.env.LIKE_SALT ?? 'gifmage-likes';

function clientIp(req: Request): string {
  const nf = req.headers.get('x-nf-client-connection-ip');
  if (nf) return nf;
  const xff = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  return xff || 'unknown';
}

export async function POST(req: Request) {
  let body: { purchase_id?: number | string; visitor_id?: string };
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const purchaseId = Number(body.purchase_id);
  const visitorId = String(body.visitor_id ?? '');
  if (
    !Number.isFinite(purchaseId) || purchaseId <= 0 || purchaseId > Number.MAX_SAFE_INTEGER ||
    visitorId.length < 8 || visitorId.length > 256
  ) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Store only hashes — never the raw IP or fingerprint.
  const voterKey = createHash('sha256').update(`${visitorId}|${SALT}`).digest('hex');
  const ipHash   = createHash('sha256').update(`${clientIp(req)}|${SALT}`).digest('hex');

  try {
    const result = await toggleLike(purchaseId, voterKey, ipHash);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'RATE_LIMITED') return Response.json({ error: 'Слишком часто, попробуйте позже' }, { status: 429 });
    if (msg === 'NOT_FOUND')    return Response.json({ error: 'Область не найдена' }, { status: 404 });
    console.error('[like]', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
