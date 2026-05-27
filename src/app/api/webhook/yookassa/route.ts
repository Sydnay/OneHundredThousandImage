import { createPurchase } from '@/lib/db';

export const dynamic = 'force-dynamic';

const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments';

export async function POST(request: Request) {
  let payload: { event?: string; object?: { id?: string; status?: string; metadata?: Record<string, string> } };
  try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (payload.event !== 'payment.succeeded') {
    return Response.json({ ok: true }); // ignore other events
  }

  const paymentId = payload.object?.id;
  if (!paymentId) return Response.json({ error: 'Missing payment id' }, { status: 400 });

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    console.error('[yookassa webhook] missing credentials');
    return Response.json({ error: 'Not configured' }, { status: 500 });
  }

  // Verify the payment by querying YooKassa directly — never trust the webhook body
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  let payment: { status?: string; metadata?: Record<string, string> };
  try {
    const res = await fetch(`${YOOKASSA_API}/${paymentId}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    payment = await res.json();
    if (!res.ok) {
      console.error('[yookassa webhook] verify failed', payment);
      return Response.json({ error: 'Verify failed' }, { status: 400 });
    }
  } catch (err) {
    console.error('[yookassa webhook] verify error', err);
    return Response.json({ error: 'Verify error' }, { status: 500 });
  }

  if (payment.status !== 'succeeded') {
    return Response.json({ ok: true }); // not actually paid
  }

  const meta = payment.metadata ?? {};
  const x      = parseInt(meta.x ?? '');
  const y      = parseInt(meta.y ?? '');
  const width  = parseInt(meta.width ?? '');
  const height = parseInt(meta.height ?? '');
  const fill_type = meta.fill_type as 'color' | 'image';

  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || !fill_type) {
    console.error('[yookassa webhook] missing metadata', meta);
    return Response.json({ error: 'Missing purchase data' }, { status: 400 });
  }

  try {
    await createPurchase({
      x, y, width, height,
      fill_type,
      color:     meta.color     || undefined,
      image_url: meta.image_url || undefined,
      label:     meta.label     || undefined,
      link_url:  meta.link_url  || undefined,
    });
    return Response.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'COLLISION') {
      return Response.json({ ok: true }); // already saved, idempotent
    }
    console.error('[yookassa webhook] db error', err);
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
}
