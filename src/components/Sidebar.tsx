'use client';

import type { ReactNode } from 'react';

type View = 'canvas' | 'leaderboard';

const CanvasIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const item = (v: View, label: string, icon: ReactNode) => (
    <button
      onClick={() => onChange(v)}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        view === v ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:bg-zinc-100'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 h-full bg-white border-r border-zinc-200 px-3 py-4">
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 grid grid-cols-2 grid-rows-2 gap-px p-1">
          <span className="bg-white/90 rounded-[1px]" /><span className="bg-white/50 rounded-[1px]" />
          <span className="bg-white/50 rounded-[1px]" /><span className="bg-white/90 rounded-[1px]" />
        </div>
        <span className="text-sm font-semibold text-zinc-900 leading-tight">Gifmage Store</span>
      </div>

      <nav className="space-y-1">
        {item('canvas', 'Холст', <CanvasIcon />)}
        {item('leaderboard', 'Рейтинг', <ChartIcon />)}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 px-3 text-[11px] text-zinc-400">
        <a href="/contacts" className="hover:text-zinc-600 transition-colors">Реквизиты</a>
        <a href="/terms" className="hover:text-zinc-600 transition-colors">Оферта</a>
        <a href="/privacy" className="hover:text-zinc-600 transition-colors">Конфиденциальность</a>
        <a href="/refund" className="hover:text-zinc-600 transition-colors">Возврат</a>
      </div>
    </aside>
  );
}
