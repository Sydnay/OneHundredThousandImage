import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const sql        = neon(process.env.DATABASE_URL);

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

async function tryDownload(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) { console.log(`  skip ${url} (${res.status})`); continue; }
      const buf = await res.arrayBuffer();
      const mimeType = res.headers.get('content-type')?.split(';')[0] ?? 'image/png';
      console.log(`  fetched from ${url}`);
      return { b64: Buffer.from(buf).toString('base64'), mimeType };
    } catch (e) { console.log(`  skip ${url} (${e.message})`); }
  }
  throw new Error('All URLs failed');
}

// MrBeast YouTube channel ID: UCX6OQ3DkcsbYNE6H8uQQuVA
const urls = [
  'https://yt3.googleusercontent.com/nxYrc_1_2f77DoBadyxMTmv7ZpRZapHR5jbuYe7PlPd5cIRJxtNNEYyOC0ZsxaDyJJzXrnJiuDE=s900-c-k-c0x00ffffff-no-rj',
];

console.log('downloading MrBeast logo...');
const { b64, mimeType } = await tryDownload(urls);
const imgUrl = await uploadBase64(b64, mimeType, 'brands/mrbeast');
console.log('uploaded:', imgUrl);

// Random position, ~20k cells
const w = 200, h = 100;
const x = Math.floor(Math.random() * (1000 - w));
const y = Math.floor(Math.random() * (1000 - h));
const now = new Date().toISOString();

await sql`
  INSERT INTO purchases (id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at)
  VALUES (16, ${x}, ${y}, ${w}, ${h}, 'image', null, ${imgUrl}, 'MrBeast', 'https://www.youtube.com/@MrBeast', ${now})
`;
console.log(`inserted MrBeast at (${x},${y}) ${w}×${h}`);
