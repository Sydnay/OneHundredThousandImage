import { Environment, EventName, LogLevel, Paddle } from '@paddle/paddle-node-sdk';
import { createPurchase } from '@/lib/db';

export const dynamic = 'force-dynamic';

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.production,
  logLevel: LogLevel.none,
});

export async function POST(request: Request) {
  const signature = request.headers.get('paddle-signature') ?? '';
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? '';
  const rawBody = await request.text();

  // Verify signature if secret is configured
  if (secret) {
    try {
      const event = paddle.webhooks.unmarshal(rawBody, secret, signature);
      if (!event) return Response.json({ error: 'Invalid signature' }, { status: 401 });
    } catch {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: { event_type?: string; data?: Record<string, unknown> };
  try { payload = JSON.parse(rawBody); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (payload.event_type !== EventName.TransactionCompleted) {
    return Response.json({ ok: true }); // ignore other events
  }

  const data = payload.data as Record<string, unknown>;
  const custom = (data?.customData ?? data?.custom_data ?? {}) as Record<string, string>;

  const x      = parseInt(custom.x ?? '');
  const y      = parseInt(custom.y ?? '');
  const width  = parseInt(custom.width ?? '');
  const height = parseInt(custom.height ?? '');
  const fill_type = custom.fill_type as 'color' | 'image';

  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || !fill_type) {
    console.error('[webhook] missing custom data', custom);
    return Response.json({ error: 'Missing purchase data' }, { status: 400 });
  }

  try {
    await createPurchase({
      x, y, width, height,
      fill_type,
      color:     custom.color     || undefined,
      image_url: custom.image_url || undefined,
      label:     custom.label     || undefined,
      link_url:  custom.link_url  || undefined,
    });
    return Response.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'COLLISION') {
      return Response.json({ ok: true }); // already saved, idempotent
    }
    console.error('[webhook] db error', err);
    return Response.json({ error: 'DB error' }, { status: 500 });
  }
}
