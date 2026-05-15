import { neon } from '@neondatabase/serverless';
import type { Purchase, PurchasePayload } from './types';

const sql = neon(process.env.DATABASE_URL!);

async function setup() {
  await sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id         BIGINT PRIMARY KEY,
      x          INT    NOT NULL,
      y          INT    NOT NULL,
      width      INT    NOT NULL,
      height     INT    NOT NULL,
      fill_type  TEXT   NOT NULL DEFAULT 'color',
      color      TEXT,
      image_url  TEXT,
      label      TEXT,
      link_url   TEXT,
      created_at TEXT   NOT NULL
    )
  `;
}

function toModel(row: Record<string, unknown>): Purchase {
  return {
    id:         Number(row.id),
    x:          Number(row.x),
    y:          Number(row.y),
    width:      Number(row.width),
    height:     Number(row.height),
    fill_type:  row.fill_type as 'color' | 'image',
    color:      (row.color as string) ?? null,
    image_url:  (row.image_url as string) ?? null,
    label:      (row.label as string) ?? null,
    link_url:   (row.link_url as string) ?? null,
    created_at: row.created_at as string,
  };
}

export async function getAllPurchases(): Promise<Purchase[]> {
  await setup();
  const rows = await sql`
    SELECT id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at
    FROM purchases
    ORDER BY id
  `;
  return rows.map(toModel);
}

export async function checkCollision(x: number, y: number, w: number, h: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM purchases
    WHERE x < ${x + w} AND x + width > ${x}
      AND y < ${y + h} AND y + height > ${y}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createPurchase(payload: PurchasePayload): Promise<Purchase> {
  await setup();
  const collision = await checkCollision(payload.x, payload.y, payload.width, payload.height);
  if (collision) throw new Error('COLLISION');

  const id = Date.now();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO purchases (id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at)
    VALUES (
      ${id}, ${payload.x}, ${payload.y}, ${payload.width}, ${payload.height},
      ${payload.fill_type},
      ${payload.color ?? null},
      ${payload.image_url ?? null},
      ${payload.label ?? null},
      ${payload.link_url ?? null},
      ${now}
    )
  `;

  return toModel({ id, ...payload, color: payload.color ?? null, image_url: payload.image_url ?? null, label: payload.label ?? null, link_url: payload.link_url ?? null, created_at: now });
}

export interface UpdatePayload {
  fill_type: 'color' | 'image';
  color?: string;
  image_url?: string;
  label?: string;
  link_url?: string;
}

export async function updatePurchase(id: number, payload: UpdatePayload): Promise<Purchase> {
  await setup();
  const rows = await sql`
    UPDATE purchases SET
      fill_type = ${payload.fill_type},
      color     = ${payload.color ?? null},
      image_url = ${payload.image_url ?? null},
      label     = ${payload.label ?? null},
      link_url  = ${payload.link_url ?? null}
    WHERE id = ${id}
    RETURNING *
  `;
  if (rows.length === 0) throw new Error('NOT_FOUND');
  return toModel(rows[0]);
}
