import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gifmage Store — твоё место в сетке',
  description: 'Купите клетки на сетке 1000×1000. Цена — 10 ₽ за клетку. Ваше изображение остаётся навсегда.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-slate-100 text-zinc-800 antialiased">{children}</body>
    </html>
  );
}
