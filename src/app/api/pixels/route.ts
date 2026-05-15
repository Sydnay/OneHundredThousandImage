import { getAllPurchases } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const purchases = await getAllPurchases();
  return Response.json({ purchases });
}
