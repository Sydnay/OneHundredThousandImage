'use client';

import { useState } from 'react';
import type { Purchase } from '@/lib/types';

const TOTAL_CELLS = 1000 * 1000;

interface Row { name: string | null; cells: number; areas: number; }

function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
}

function RankBadge({ i }: { i: number }) {
  return (
    <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
      i === 0 ? 'bg-amber-100 text-amber-700' :
      i === 1 ? 'bg-zinc-200 text-zinc-600' :
      i === 2 ? 'bg-orange-100 text-orange-700' :
      'bg-zinc-100 text-zinc-400'
    }`}>{i + 1}</span>
  );
}

export default function Leaderboard({ purchases }: { purchases: Purchase[] }) {
  const [tab, setTab] = useState<'cells' | 'popular'>('cells');

  // By cells (money): group by label; anonymous merged.
  const map = new Map<string, Row>();
  for (const p of purchases) {
    const name = p.label && p.label.trim() ? p.label.trim() : null;
    const key = name ? name.toLowerCase() : '__anon__';
    const row = map.get(key) ?? { name, cells: 0, areas: 0 };
    row.cells += p.width * p.height;
    row.areas += 1;
    map.set(key, row);
  }
  const cellRows = Array.from(map.values()).sort((a, b) => b.cells - a.cells);
  const maxCells = cellRows.length ? cellRows[0].cells : 1;

  // By popularity: individual areas ranked by likes.
  const popular = purchases.filter(p => (p.likes ?? 0) > 0).sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).slice(0, 100);
  const maxLikes = popular.length ? (popular[0].likes ?? 0) : 1;

  const tabCls = (t: typeof tab) =>
    `flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`;

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      <div className="max-w-2xl mx-auto px-5 pt-16 pb-10 md:py-12">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Рейтинг</h1>
          <p className="text-sm text-zinc-500 mt-1">Лидеры сетки Gifmage Store</p>
        </header>

        <div className="flex bg-zinc-100 rounded-lg p-0.5 mb-5 max-w-xs">
          <button onClick={() => setTab('cells')} className={tabCls('cells')}>По клеткам</button>
          <button onClick={() => setTab('popular')} className={tabCls('popular')}>По популярности</button>
        </div>

        {tab === 'cells' ? (
          cellRows.length === 0 ? (
            <div className="rounded-xl bg-white border border-zinc-200 px-5 py-12 text-center text-sm text-zinc-400">
              Пока никто не купил клетки. Будьте первым!
            </div>
          ) : (
            <ol className="space-y-2">
              {cellRows.map((r, i) => (
                <li key={r.name ? r.name.toLowerCase() : '__anon__'} className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                  <RankBadge i={i} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm font-medium truncate ${r.name ? 'text-zinc-800' : 'text-zinc-400 italic'}`}>{r.name ?? 'Аноним'}</span>
                      <span className="text-sm font-semibold text-zinc-900 shrink-0">{r.cells.toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(3, (r.cells / maxCells) * 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-zinc-400 shrink-0 whitespace-nowrap">
                        {r.areas} {plural(r.areas, 'область', 'области', 'областей')} · {((r.cells / TOTAL_CELLS) * 100).toFixed(r.cells / TOTAL_CELLS < 0.01 ? 3 : 1)}%
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )
        ) : (
          popular.length === 0 ? (
            <div className="rounded-xl bg-white border border-zinc-200 px-5 py-12 text-center text-sm text-zinc-400">
              Пока никто не поставил лайк. Откройте клетку и оцените её ❤
            </div>
          ) : (
            <ol className="space-y-2">
              {popular.map((p, i) => {
                const likes = p.likes ?? 0;
                const name = p.label && p.label.trim() ? p.label.trim() : null;
                return (
                  <li key={p.id} className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                    <RankBadge i={i} />
                    <div className="w-8 h-8 shrink-0 rounded-md border border-zinc-200 overflow-hidden bg-zinc-50">
                      {p.fill_type === 'image' && p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: p.color ?? '#e4e4e7' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-sm font-medium truncate ${name ? 'text-zinc-800' : 'text-zinc-400 italic'}`}>{name ?? 'Аноним'}</span>
                        <span className="text-sm font-semibold text-rose-600 shrink-0 flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                          {likes}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.max(3, (likes / maxLikes) * 100)}%` }} />
                        </div>
                        <span className="text-[11px] text-zinc-400 shrink-0 whitespace-nowrap">{p.width}×{p.height} · ({p.x}, {p.y})</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )
        )}
      </div>
    </div>
  );
}
