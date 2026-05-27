import { randomUUID } from 'crypto';
import { priceForCells, CURRENCY } from '@/lib/pricing';

const COLS = 1000;
const ROWS = 1000;

const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments';

export async function POST(request: Request) {
  let body: {
    x: number; y: number; width: number; height: number;
    fill_type: string; color?: string; image_url?: string;
    label?: string; link_url?: string; email?: string;
  };
  try { body = await request.json(); } catch { return Response.json({ error: 'Некорректный запрос' }, { status: 400 }); }

  const { x, y, width, height, fill_type, color, image_url, email } = body;

  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    typeof width !== 'number' || typeof height !== 'number' ||
    width < 1 || height < 1 || x < 0 || y < 0 ||
    x + width > COLS || y + height > ROWS
  ) return Response.json({ error: 'Некорректная область' }, { status: 400 });

  if (fill_type === 'color' && (!color || !/^#[0-9a-fA-F]{6}$/.test(color)))
    return Response.json({ error: 'Некорректный цвет' }, { status: 400 });

  if (fill_type === 'image' && !image_url)
    return Response.json({ error: 'Не выбрано изображение' }, { status: 400 });

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return Response.json({ error: 'Укажите корректный email для чека' }, { status: 400 });

  const cells = width * height;
  const amount = priceForCells(cells).toFixed(2);

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    console.error('[yookassa] missing credentials');
    return Response.json({ error: 'Платёжная система не настроена' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(request.url).origin;
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  const payment = {
    amount: { value: amount, currency: CURRENCY },
    capture: true,
    confirmation: { type: 'redirect', return_url: baseUrl },
    description: `Область ${width}×${height} (${cells} клеток) на Million Dollar Grid`,
    metadata: {
      x: String(x), y: String(y),
      width: String(width), height: String(height),
      fill_type,
      color: color ?? '',
      image_url: image_url ?? '',
      label: body.label ?? '',
      link_url: body.link_url ?? '',
    },
    receipt: {
      customer: { email },
      items: [{
        description: `Размещение области ${width}×${height} (${cells} клеток)`,
        quantity: '1.00',
        amount: { value: amount, currency: CURRENCY },
        vat_code: 1,            // без НДС (самозанятый)
        payment_subject: 'service',
        payment_mode: 'full_payment',
      }],
    },
  };

  try {
    const res = await fetch(YOOKASSA_API, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': randomUUID(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[yookassa checkout]', data);
      return Response.json({ error: 'Не удалось создать платёж' }, { status: 500 });
    }

    const checkoutUrl = data.confirmation?.confirmation_url;
    if (!checkoutUrl) {
      console.error('[yookassa] no confirmation_url', data);
      return Response.json({ error: 'Не удалось создать платёж' }, { status: 500 });
    }
    return Response.json({ checkoutUrl });
  } catch (err) {
    console.error('[yookassa checkout]', err);
    return Response.json({ error: 'Не удалось создать платёж' }, { status: 500 });
  }
}
