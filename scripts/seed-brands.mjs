import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const now = new Date().toISOString();

const brands = [
  { id: 10, x: 50,  y: 50,  w: 80, h: 60, img: 'https://logo.clearbit.com/google.com',  label: 'Google',  link: 'https://google.com' },
  { id: 11, x: 200, y: 50,  w: 80, h: 60, img: 'https://logo.clearbit.com/apple.com',   label: 'Apple',   link: 'https://apple.com' },
  { id: 12, x: 350, y: 50,  w: 80, h: 60, img: 'https://logo.clearbit.com/nike.com',    label: 'Nike',    link: 'https://nike.com' },
  { id: 13, x: 500, y: 50,  w: 80, h: 60, img: 'https://logo.clearbit.com/amazon.com',  label: 'Amazon',  link: 'https://amazon.com' },
  { id: 14, x: 650, y: 50,  w: 80, h: 60, img: 'https://logo.clearbit.com/netflix.com', label: 'Netflix', link: 'https://netflix.com' },
  { id: 15, x: 800, y: 50,  w: 80, h: 60, img: 'https://logo.clearbit.com/spotify.com', label: 'Spotify', link: 'https://spotify.com' },
];

for (const b of brands) {
  await sql`
    INSERT INTO purchases (id, x, y, width, height, fill_type, color, image_url, label, link_url, created_at)
    VALUES (${b.id}, ${b.x}, ${b.y}, ${b.w}, ${b.h}, 'image', null, ${b.img}, ${b.label}, ${b.link}, ${now})
  `;
  console.log('inserted', b.label);
}
