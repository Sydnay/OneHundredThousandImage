import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk';

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.production,
  logLevel: LogLevel.none,
});

const COLS = 1000;
const ROWS = 1000;

export async function POST(request: Request) {
  let body: { x: number; y: number; width: number; height: number; fill_type: string; color?: string; image_url?: string; label?: string; link_url?: string };
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { x, y, width, height, fill_type, color, image_url } = body;

  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    typeof width !== 'number' || typeof height !== 'number' ||
    width < 1 || height < 1 || x < 0 || y < 0 ||
    x + width > COLS || y + height > ROWS
  ) return Response.json({ error: 'Invalid selection' }, { status: 400 });

  if (fill_type === 'color' && (!color || !/^#[0-9a-fA-F]{6}$/.test(color)))
    return Response.json({ error: 'Invalid color' }, { status: 400 });

  if (fill_type === 'image' && !image_url)
    return Response.json({ error: 'Missing image_url' }, { status: 400 });

  const quantity = width * height;
  const priceId = process.env.PADDLE_PRICE_ID!;

  try {
    const txn = await paddle.transactions.create({
      items: [{ priceId, quantity }],
      customData: {
        x: String(x), y: String(y),
        width: String(width), height: String(height),
        fill_type,
        color: color ?? '',
        image_url: image_url ?? '',
        label: body.label ?? '',
        link_url: body.link_url ?? '',
      },
    });

    const checkoutUrl = txn.checkout?.url ?? `https://checkout.paddle.com/checkout/custom/${txn.id}`;
    return Response.json({ checkoutUrl });
  } catch (err) {
    console.error('[paddle checkout]', err);
    return Response.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
