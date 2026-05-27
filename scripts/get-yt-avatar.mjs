const res = await fetch('https://www.youtube.com/@MrBeast', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' }
});
const html = await res.text();
const m = html.match(/og:image[^>]+content="([^"]+)"/);
const m2 = html.match(/"thumbnails":\[{"url":"([^"]+)"/);
console.log('og:image:', m?.[1]);
console.log('thumbnail:', m2?.[1]);
