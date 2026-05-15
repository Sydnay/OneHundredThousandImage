import { createPurchase } from '@/lib/db';
import type { PurchasePayload } from '@/lib/types';
import { isUrlUnsafe } from '@/lib/safebrowsing';

const COLS = 400;
const ROWS = 250;

export async function POST(request: Request) {
  let body: PurchasePayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { x, y, width, height, fill_type, color, image_url } = body;

  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    typeof width !== 'number' || typeof height !== 'number' ||
    width < 1 || height < 1 ||
    x < 0 || y < 0 ||
    x + width > COLS || y + height > ROWS
  ) {
    return Response.json({ error: 'Invalid selection' }, { status: 400 });
  }

  if (fill_type === 'color' && (!color || !/^#[0-9a-fA-F]{6}$/.test(color))) {
    return Response.json({ error: 'Invalid color' }, { status: 400 });
  }

  if (fill_type === 'image' && !image_url) {
    return Response.json({ error: 'Missing image_url' }, { status: 400 });
  }

  if (body.link_url) {
    const unsafe = await isUrlUnsafe(body.link_url);
    if (unsafe) {
      return Response.json({ error: 'The link URL was flagged as unsafe.' }, { status: 400 });
    }
  }

  try {
    const purchase = await createPurchase(body);
    return Response.json({ ok: true, purchase });
  } catch (err) {
    if (err instanceof Error && err.message === 'COLLISION') {
      return Response.json({ error: 'Area already purchased' }, { status: 409 });
    }
    console.error(err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
