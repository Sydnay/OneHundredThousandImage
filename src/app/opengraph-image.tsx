import { ImageResponse } from 'next/og';

// Edge runtime: Netlify's node runtime doesn't bundle @vercel/og's WASM (→ 500),
// edge does. Also why it can't be previewed on the local Windows/Cyrillic path.
export const runtime = 'edge';

export const alt = 'Gifmage Store — купи пиксель, размести картинку или GIF';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const cells = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#ec4899', '#f472b6',
  '#f59e0b', '#fbbf24', '#10b981', '#34d399', '#3b82f6',
  '#60a5fa', '#ef4444', '#f87171', '#14b8a6', '#06b6d4',
  '#22d3ee', '#eab308', '#84cc16', '#f97316', '#e879f9',
  '#fb7185', '#2dd4bf', '#818cf8', '#c084fc', '#fde047',
];

export default async function Image() {
  const [bold, regular] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-cyrillic-700-normal.woff').then(r => r.arrayBuffer()),
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-cyrillic-400-normal.woff').then(r => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: '#0b0b12', color: '#fff', fontFamily: 'Inter', padding: '70px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingRight: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginBottom: '34px' }}>
            <div style={{ width: '92px', height: '92px', borderRadius: '22px', backgroundImage: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', flexWrap: 'wrap', padding: '14px', gap: '6px' }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#fff', opacity: i === 4 ? 1 : 0.35 }} />
              ))}
            </div>
            <div style={{ fontSize: '52px', fontWeight: 700 }}>Gifmage Store</div>
          </div>
          <div style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1.18, marginBottom: '18px' }}>
            Купи пиксель. Размести картинку или GIF.
          </div>
          <div style={{ fontSize: '30px', color: '#a1a1aa', marginBottom: '40px' }}>
            Останется на сетке навсегда.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '27px', color: '#c4b5fd', fontWeight: 700 }}>
            <span>1 000 000 клеток</span><span style={{ color: '#52525b' }}>·</span><span>10 ₽ за клетку</span><span style={{ color: '#52525b' }}>·</span><span>gifmage.ru</span>
          </div>
        </div>
        <div style={{ width: '320px', display: 'flex', flexWrap: 'wrap', alignContent: 'center', gap: '9px' }}>
          {cells.map((c, i) => (
            <div key={i} style={{ width: '56px', height: '56px', borderRadius: '9px', backgroundColor: c }} />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
      ],
    },
  );
}
