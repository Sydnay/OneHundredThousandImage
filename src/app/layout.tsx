import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://gifmage.ru'),
  title: 'Gifmage Store — твоё место в сетке',
  description: 'Купите клетки на сетке 1000×1000. Цена — 10 ₽ за клетку. Ваше изображение или GIF остаётся навсегда.',
  openGraph: {
    title: 'Gifmage Store — твоё место в сетке',
    description: 'Купи пиксель, размести картинку или GIF — останется на сетке навсегда. 1 000 000 клеток по 10 ₽.',
    url: '/',
    siteName: 'Gifmage Store',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gifmage Store — твоё место в сетке',
    description: 'Купи пиксель, размести картинку или GIF — навсегда. 1 000 000 клеток по 10 ₽.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-slate-100 text-zinc-800 antialiased">{children}</body>
    </html>
  );
}
