'use client';

import type { Purchase } from '@/lib/types';

const TOTAL_CELLS = 1000 * 1000;

interface Row { name: string | null; cells: number; areas: number; }

function areaWord(n: number): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'область';
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'области';
  return 'областей';
}

export default function Leaderboard({ purchases }: { purchases: Purchase[] }) {
  // Group by label (case-insensitive); purchases without a label are merged under "Аноним".
  const map = new Map<string, Row>();
  for (const p of purchases) {
    const name = p.label && p.label.trim() ? p.label.trim() : null;
    const key = name ? name.toLowerCase() : '__anon__';
    const cells = p.width * p.height;
    const row = map.get(key) ?? { name, cells: 0, areas: 0 };
    row.cells += cells;
    row.areas += 1;
    map.set(key, row);
  }
  const rows = Array.from(map.values()).sort((a, b) => b.cells - a.cells);
  const max = rows.length ? rows[0].cells : 1;

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      <div className="max-w-2xl mx-auto px-5 pt-16 pb-10 md:py-12">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-zinc-900">Рейтинг</h1>
          <p className="text-sm text-zinc-500 mt-1">Топ по количеству купленных клеток</p>
        </header>

        {rows.length === 0 ? (
          <div className="rounded-xl bg-white border border-zinc-200 px-5 py-12 text-center text-sm text-zinc-400">
            Пока никто не купил клетки. Будьте первым!
          </div>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-zinc-200 text-zinc-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-zinc-100 text-zinc-400'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${r.name ? 'text-zinc-800' : 'text-zinc-400 italic'}`}>
                      {r.name ?? 'Аноним'}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 shrink-0">{r.cells.toLocaleString('ru-RU')}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(3, (r.cells / max) * 100)}%` }} />
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0 whitespace-nowrap">
                      {r.areas} {areaWord(r.areas)} · {((r.cells / TOTAL_CELLS) * 100).toFixed(r.cells / TOTAL_CELLS < 0.01 ? 3 : 1)}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
