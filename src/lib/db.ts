import { neon } from '@neondatabase/serverless';
import type { Purchase, PurchasePayload } from './types';

const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' } });

let setupPromise: Promise<void> | null = null;
function setup(): Promise<void> {
  if (!setupPromise) setupPromise = doSetup();
  return setupPromise;
}

async function doSetup() {
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
  // Likes: one row per (cell, voter). voter_key = hash(browser fingerprint),
  // ip_hash = hash(ip) — only hashes are stored, never raw IP / fingerprint.
  await sql`
    CREATE TABLE IF NOT EXISTS likes (
      purchase_id BIGINT      NOT NULL,
      voter_key   TEXT        NOT NULL,
      ip_hash     TEXT        NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (purchase_id, voter_key)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_likes_ip ON likes (ip_hash, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_likes_purchase ON likes (purchase_id)`;
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
    likes:      Number(row.likes ?? 0),
  };
}

export async function getAllPurchases(): Promise<Purchase[]> {
  await setup();
  const rows = await sql`
    SELECT p.id, p.x, p.y, p.width, p.height, p.fill_type, p.color, p.image_url, p.label, p.link_url, p.created_at,
           COALESCE(l.cnt, 0)::int AS likes
    FROM purchases p
    LEFT JOIN (SELECT purchase_id, COUNT(*) AS cnt FROM likes GROUP BY purchase_id) l
      ON l.purchase_id = p.id
    ORDER BY p.id
  `;
  return rows.map(toModel);
}

const FLOOD_PER_IP   = 30; // max like-adds per IP per 60s (anti-flood)
const PER_CELL_PER_IP = 8; // max likes on ONE cell from ONE IP (anti-inflation; generous for shared NAT)

/** Toggle a like for a cell. Returns the new state + count. Unlike is never rate-limited. */
export async function toggleLike(purchaseId: number, voterKey: string, ipHash: string): Promise<{ liked: boolean; count: number }> {
  await setup();

  const exists = await sql`SELECT 1 FROM purchases WHERE id = ${purchaseId} LIMIT 1`;
  if (exists.length === 0) throw new Error('NOT_FOUND');

  // Atomic toggle: try to remove this voter's like first. If a row was deleted it
  // was an unlike; otherwise we add one. Avoids the SELECT-then-INSERT race.
  const deleted = await sql`
    DELETE FROM likes WHERE purchase_id = ${purchaseId} AND voter_key = ${voterKey}
    RETURNING purchase_id
  `;

  let liked: boolean;
  if (deleted.length > 0) {
    liked = false; // unlike — no limits
  } else {
    // Adding a like — apply anti-abuse caps only on add.
    const recent = await sql`
      SELECT COUNT(*)::int AS c FROM likes
      WHERE ip_hash = ${ipHash} AND created_at > now() - interval '60 seconds'
    `;
    if (Number(recent[0]?.c ?? 0) >= FLOOD_PER_IP) throw new Error('RATE_LIMITED');

    const perCell = await sql`
      SELECT COUNT(*)::int AS c FROM likes WHERE purchase_id = ${purchaseId} AND ip_hash = ${ipHash}
    `;
    if (Number(perCell[0]?.c ?? 0) >= PER_CELL_PER_IP) throw new Error('RATE_LIMITED');

    await sql`
      INSERT INTO likes (purchase_id, voter_key, ip_hash)
      VALUES (${purchaseId}, ${voterKey}, ${ipHash})
      ON CONFLICT (purchase_id, voter_key) DO NOTHING
    `;
    liked = true;
  }

  const cnt = await sql`SELECT COUNT(*)::int AS c FROM likes WHERE purchase_id = ${purchaseId}`;
  return { liked, count: Number(cnt[0]?.c ?? 0) };
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

// Auto-generated "bot"-style name for buyers who leave the name blank — so they
// each get a distinct identity in the leaderboard instead of merging as "Аноним".
const BOT_ADJ = ['Шустрый', 'Дерзкий', 'Хитрый', 'Грозный', 'Весёлый', 'Тихий', 'Быстрый', 'Смелый', 'Ленивый', 'Мудрый', 'Сонный', 'Бравый', 'Лихой', 'Наглый', 'Пушистый', 'Крутой', 'Тайный', 'Дикий', 'Гордый', 'Бешеный'];
const BOT_NOUN = ['Барсук', 'Енот', 'Лис', 'Ёж', 'Волк', 'Бобр', 'Хорёк', 'Сокол', 'Тигр', 'Краб', 'Филин', 'Кабан', 'Лось', 'Суслик', 'Морж', 'Пингвин', 'Хомяк', 'Орёл', 'Жираф', 'Слон'];

function randomBotName(): string {
  const a = BOT_ADJ[Math.floor(Math.random() * BOT_ADJ.length)];
  const n = BOT_NOUN[Math.floor(Math.random() * BOT_NOUN.length)];
  const num = Math.floor(Math.random() * 9900) + 100;
  return `${a} ${n} ${num}`;
}

export async function createPurchase(payload: PurchasePayload): Promise<Purchase> {
  await setup();
  const collision = await checkCollision(payload.x, payload.y, payload.width, payload.height);
  if (collision) throw new Error('COLLISION');

  const id = Date.now();
  const now = new Date().toISOString();
  const label = payload.label && payload.label.trim() ? payload.label.trim() : randomBotName();

  await sql`
    INSERT INTO purchases (id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at)
    VALUES (
      ${id}, ${payload.x}, ${payload.y}, ${payload.width}, ${payload.height},
      ${payload.fill_type},
      ${payload.color ?? null},
      ${payload.image_url ?? null},
      ${label},
      ${payload.link_url ?? null},
      ${now}
    )
  `;

  return toModel({ id, ...payload, color: payload.color ?? null, image_url: payload.image_url ?? null, label, link_url: payload.link_url ?? null, created_at: now });
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
  const updated = await sql`
    UPDATE purchases SET
      fill_type = ${payload.fill_type},
      color     = ${payload.color ?? null},
      image_url = ${payload.image_url ?? null},
      label     = ${payload.label ?? null},
      link_url  = ${payload.link_url ?? null}
    WHERE id = ${id}
    RETURNING id
  `;
  if (updated.length === 0) throw new Error('NOT_FOUND');
  const rows = await sql`
    SELECT p.id, p.x, p.y, p.width, p.height, p.fill_type, p.color, p.image_url, p.label, p.link_url, p.created_at,
           COALESCE(l.cnt, 0)::int AS likes
    FROM purchases p
    LEFT JOIN (SELECT purchase_id, COUNT(*) AS cnt FROM likes GROUP BY purchase_id) l ON l.purchase_id = p.id
    WHERE p.id = ${id}
  `;
  return toModel(rows[0]);
}
