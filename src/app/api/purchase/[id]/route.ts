import { NextRequest, NextResponse } from 'next/server';
import { updatePurchase } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const { fill_type, color, image_url, label, link_url } = body;

  if (fill_type !== 'color' && fill_type !== 'image') {
    return NextResponse.json({ error: 'Invalid fill_type' }, { status: 400 });
  }
  if (fill_type === 'color' && !color) {
    return NextResponse.json({ error: 'color is required' }, { status: 400 });
  }
  if (fill_type === 'image' && !image_url) {
    return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
  }

  try {
    const updated = await updatePurchase(id, { fill_type, color, image_url, label, link_url });
    return NextResponse.json({ ok: true, purchase: updated });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
