import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '100K Pixel Grid — Own a piece',
  description: 'Buy pixels on a 400×250 grid. Each cell is $1. Yours forever.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-zinc-800 antialiased">{children}</body>
    </html>
  );
}
