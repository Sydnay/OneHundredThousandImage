import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const sql        = neon(process.env.DATABASE_URL);
const now        = new Date().toISOString();

function sign(params) {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + API_SECRET;
  return createHash('sha1').update(str).digest('hex');
}

async function uploadBase64(b64data, mimeType, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, overwrite: 'true', timestamp };
  const signature = sign(params);
  const form = new FormData();
  form.append('file', `data:${mimeType};base64,${b64data}`);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('timestamp', String(timestamp));
  form.append('api_key', API_KEY);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.secure_url;
}

async function downloadAsBase64(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' } });
      if (!res.ok) { console.log(`  skip ${url} (${res.status})`); continue; }
      const buf = await res.arrayBuffer();
      const mimeType = res.headers.get('content-type')?.split(';')[0] ?? 'image/png';
      return { b64: Buffer.from(buf).toString('base64'), mimeType };
    } catch (e) { console.log(`  skip ${url} (${e.message})`); }
  }
  throw new Error('All URLs failed');
}

const brands = [
  { id: 11, x: 200, y: 50,  w: 100, h: 100, publicId: 'brands/apple',
    label: 'Apple', link: 'https://apple.com',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png',
      'https://www.apple.com/ac/structured-data/images/knowledge_graph_logo.png',
    ]},
  { id: 12, x: 350, y: 50,  w: 150, h: 60,  publicId: 'brands/netflix',
    label: 'Netflix', link: 'https://netflix.com',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1920px-Netflix_2015_logo.svg.png',
      'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png',
    ]},
  { id: 13, x: 550, y: 50,  w: 100, h: 100, publicId: 'brands/spotify',
    label: 'Spotify', link: 'https://spotify.com',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png',
      'https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico',
    ]},
  { id: 14, x: 700, y: 50,  w: 120, h: 60,  publicId: 'brands/amazon',
    label: 'Amazon', link: 'https://amazon.com',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1920px-Amazon_logo.svg.png',
      'https://www.amazon.com/favicon.ico',
    ]},
  { id: 15, x: 870, y: 50,  w: 100, h: 60,  publicId: 'brands/nike',
    label: 'Nike', link: 'https://nike.com',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1920px-Logo_NIKE.svg.png',
      'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
    ]},
];

// Google already uploaded, skip id 10
await sql`DELETE FROM purchases WHERE id IN (11, 12, 13, 14, 15)`;
console.log('deleted purchases for remaining brands');

for (const b of brands) {
  console.log(`uploading ${b.label}...`);
  const { b64, mimeType } = await downloadAsBase64(b.urls);
  const imgUrl = await uploadBase64(b64, mimeType, b.publicId);
  console.log(`  → ${imgUrl}`);
  await sql`
    INSERT INTO purchases (id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at)
    VALUES (${b.id}, ${b.x}, ${b.y}, ${b.w}, ${b.h}, 'image', null, ${imgUrl}, ${b.label}, ${b.link}, ${now})
  `;
  console.log(`  inserted`);
}
console.log('done');
