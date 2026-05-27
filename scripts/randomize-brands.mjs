import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const COLS = 1000;
const ROWS = 1000;
const MIN_AREA = 1000;
const MAX_AREA = 50000;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + b.h > b.y;
}

function randomRect(placed) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const area = randInt(MIN_AREA, MAX_AREA);
    // random aspect ratio between 0.5 and 2
    const ratio = 0.5 + Math.random() * 1.5;
    const w = Math.max(20, Math.min(COLS, Math.round(Math.sqrt(area * ratio))));
    const h = Math.max(20, Math.min(ROWS, Math.round(area / w)));
    const x = randInt(0, COLS - w);
    const y = randInt(0, ROWS - h);
    const rect = { x, y, w, h };
    if (!placed.some(p => overlaps(rect, p))) return rect;
  }
  throw new Error('Could not place rect without overlap');
}

// fetch current brand rows to keep image_url, label, link_url
const rows = await sql`SELECT id, image_url, label, link_url FROM purchases WHERE id IN (10,11,12,13,14,15) ORDER BY id`;
console.log('found', rows.length, 'brands');

await sql`DELETE FROM purchases WHERE id IN (10,11,12,13,14,15)`;

const placed = [];
const now = new Date().toISOString();

for (const row of rows) {
  const rect = randomRect(placed);
  placed.push(rect);
  await sql`
    INSERT INTO purchases (id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at)
    VALUES (${row.id}, ${rect.x}, ${rect.y}, ${rect.w}, ${rect.h}, 'image', null, ${row.image_url}, ${row.label}, ${row.link_url}, ${now})
  `;
  console.log(`${row.label}: (${rect.x},${rect.y}) ${rect.w}×${rect.h} = ${rect.w * rect.h} cells`);
}
console.log('done');
