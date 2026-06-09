'use client';

import { useState, useEffect, useRef } from 'react';
import { getVisitorId } from '@/lib/fingerprint';

const LS_KEY = 'gfp_liked';

function getLikedSet(): Set<number> {
  try { return new Set<number>(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch { return new Set(); }
}
function persistLiked(id: number, liked: boolean) {
  try {
    const s = getLikedSet();
    if (liked) s.add(id); else s.delete(id);
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(s)));
  } catch { /* ignore */ }
}

export default function LikeButton({ purchaseId, initialCount }: { purchaseId: number; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false); // synchronous guard — state updates lag and let double-clicks through

  useEffect(() => {
    setCount(initialCount);
    setLiked(getLikedSet().has(purchaseId));
    setError(null);
  }, [purchaseId, initialCount]);

  const onClick = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const prevLiked = liked, prevCount = count;
    // optimistic
    setLiked(!prevLiked);
    setCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const vid = await getVisitorId();
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_id: purchaseId, visitor_id: vid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLiked(prevLiked); setCount(prevCount);
        setError(data.error ?? 'Не удалось');
        return;
      }
      setLiked(data.liked);
      setCount(data.count);
      persistLiked(purchaseId, data.liked);
    } catch {
      setLiked(prevLiked); setCount(prevCount);
      setError('Ошибка сети');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-60 ${
          liked
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-white border-zinc-200 text-zinc-600 hover:border-rose-200 hover:text-rose-500'
        }`}
        title={liked ? 'Убрать лайк' : 'Нравится'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="tabular-nums">{count}</span>
      </button>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  );
}
