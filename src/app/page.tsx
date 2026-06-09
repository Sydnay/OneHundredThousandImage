'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import PixelCanvas from '@/components/PixelCanvas';
import PurchasePanel from '@/components/PurchasePanel';
import Sidebar from '@/components/Sidebar';
import Leaderboard from '@/components/Leaderboard';
import type { NormalizedSelection, Purchase } from '@/lib/types';

type View = 'canvas' | 'leaderboard';

export default function Home() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [view, setView] = useState<View>('canvas');
  const [focusTarget, setFocusTarget] = useState<{ x: number; y: number; width: number; height: number; token: number } | null>(null);
  const [selection, setSelection] = useState<NormalizedSelection | null>(null);
  const [clickedPurchase, setClickedPurchase] = useState<Purchase | null>(null);

  const [fillType, setFillType] = useState<'color' | 'image'>('color');
  const [color, setColor] = useState('#6366f1');
  const [imageUrl, setImageUrl] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const panelElRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef(false);
  const panelVisibleRef = useRef(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      isMobileRef.current = mobile;
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      const res = await fetch('/api/pixels', { cache: 'no-store' });
      const data = await res.json();
      setPurchases(data.purchases ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchPurchases();
    const interval = setInterval(fetchPurchases, 30_000);
    return () => clearInterval(interval);
  }, [fetchPurchases]);

  const handleSelectionChange = useCallback((sel: NormalizedSelection | null) => {
    setSelection(sel);
    setClickedPurchase(null);
    if (sel) setPanelCollapsed(false);
  }, []);

  const handlePurchaseClick = useCallback((purchase: Purchase) => {
    setClickedPurchase(purchase);
    setSelection(null);
    setPanelCollapsed(false);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelection(null);
    setClickedPurchase(null);
    setSelectMode(false);
    setPanelCollapsed(false);
  }, []);

  const handleCollapsePanel = useCallback(() => {
    setPanelCollapsed(true);
  }, []);

  const handleNewPurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => [...prev, purchase]);
    fetchPurchases();
  }, [fetchPurchases]);

  const handleViewChange = useCallback((v: View) => {
    setView(v);
    if (v !== 'canvas') {
      setSelection(null);
      setClickedPurchase(null);
      setSelectMode(false);
      setPanelCollapsed(false);
    }
  }, []);

  const focusTokenRef = useRef(0);
  const handleSelectCell = useCallback((p: Purchase) => {
    focusTokenRef.current += 1;
    setFocusTarget({ x: p.x, y: p.y, width: p.width, height: p.height, token: focusTokenRef.current });
    setSelection(null);
    setClickedPurchase(null);
    setSelectMode(false);
    setPanelCollapsed(false);
    setView('canvas');
  }, []);

  const panelOpen = !!(selection || clickedPurchase);
  const panelVisible = panelOpen && !panelCollapsed;

  useEffect(() => {
    panelVisibleRef.current = panelVisible;
  }, [panelVisible]);

  useEffect(() => {
    let startY = 0;
    let startScrollTop = 0;
    let startTarget: EventTarget | null = null;
    let dragging = false; // true = panel is following finger downward

    const getAside = () => panelElRef.current?.querySelector('aside') ?? null;

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startTarget = e.target;
      dragging = false;
      const aside = getAside();
      // Record scrollTop at gesture start — not at end — to avoid false dismiss
      startScrollTop = aside ? aside.scrollTop : 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!panelVisibleRef.current || !isMobileRef.current) return;
      const panelEl = panelElRef.current;
      if (!panelEl) return;
      const aside = getAside();
      const dy = e.touches[0].clientY - startY;

      if (!dragging) {
        const inPanel = panelEl.contains(startTarget as Node);
        // Start dismiss drag only when: inside panel, scrollTop was 0 at start, swiping down
        if (inPanel && startScrollTop === 0 && dy > 8) {
          dragging = true;
          panelEl.style.transition = 'none';
        } else {
          // Allow aside scroll if it has room
          if (aside && aside.contains(startTarget as Node)) {
            const canScrollDown = aside.scrollTop < aside.scrollHeight - aside.clientHeight;
            const canScrollUp = aside.scrollTop > 0;
            if ((dy < 0 && canScrollDown) || (dy > 0 && canScrollUp)) return;
          }
          e.preventDefault();
          return;
        }
      }

      // Dragging — panel follows finger
      e.preventDefault();
      panelEl.style.transform = `translateY(${Math.max(0, dy)}px)`;
    };

    const onEnd = (e: TouchEvent) => {
      if (!panelVisibleRef.current || !isMobileRef.current) return;
      const panelEl = panelElRef.current;
      if (!panelEl) return;
      const dy = e.changedTouches[0].clientY - startY;

      if (dragging) {
        panelEl.style.transition = '';
        if (dy > 80) {
          // Dismiss: snap to translateY(100%) then let React take over
          panelEl.style.transform = 'translateY(100%)';
          setTimeout(() => {
            panelEl.style.transform = '';
            setPanelCollapsed(true);
          }, 300);
        } else {
          // Snap back to 0
          panelEl.style.transform = 'translateY(0)';
          setTimeout(() => { panelEl.style.transform = ''; }, 300);
        }
        dragging = false;
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <main className="flex h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-slate-100 relative">
      <Sidebar view={view} onChange={handleViewChange} />

      <div className="flex-1 relative overflow-hidden">
        {/* Mobile view switcher */}
        {isMobile && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-full p-0.5 shadow-sm text-xs">
            <button
              onClick={() => handleViewChange('canvas')}
              className={`px-4 py-1.5 rounded-full font-medium transition-colors ${view === 'canvas' ? 'bg-indigo-600 text-white' : 'text-zinc-600'}`}
            >Холст</button>
            <button
              onClick={() => handleViewChange('leaderboard')}
              className={`px-4 py-1.5 rounded-full font-medium transition-colors ${view === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-zinc-600'}`}
            >Рейтинг</button>
          </div>
        )}

        {view === 'leaderboard' ? (
          <Leaderboard purchases={purchases} onSelectCell={handleSelectCell} />
        ) : (
        <>
        <PixelCanvas
          purchases={purchases}
          selection={selection}
          fillType={fillType}
          color={color}
          imageUrl={imageUrl}
          selectMode={selectMode}
          focusTarget={focusTarget}
          onSelectionChange={sel => { handleSelectionChange(sel); if (sel) setSelectMode(false); }}
          onPurchaseClick={handlePurchaseClick}
        />

{!panelVisible && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            {panelOpen && panelCollapsed && (
              <button
                onClick={() => setPanelCollapsed(false)}
                className="px-4 py-2 rounded-full text-xs font-medium shadow-md bg-indigo-600 text-white transition-colors"
              >
                ↑ Показать панель
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setSelectMode(v => !v)}
                className={`px-4 py-2 rounded-full text-xs font-medium shadow-md transition-colors ${
                  selectMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/90 text-zinc-700 border border-zinc-200'
                }`}
              >
                {selectMode ? 'Коснитесь и тяните' : '✏ Выделить область'}
              </button>
            )}
            {!panelOpen && (
              <div className="pointer-events-none bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full px-4 py-2 text-xs text-zinc-500 shadow-sm whitespace-nowrap">
                {isMobile ? 'Щипок — масштаб · касание — просмотр' : 'Выделите мышью · колёсико — масштаб · клик — просмотр'}
              </div>
            )}
          </div>
        )}

        </>
        )}
      </div>

      {/* Backdrop — tap outside panel to collapse */}
      {view === 'canvas' && panelVisible && isMobile && (
        <div
          className="absolute inset-0 z-10"
          onClick={handleCollapsePanel}
        />
      )}

      {/* Panel — slides from right on desktop, from bottom on mobile */}
      <div
        ref={panelElRef}
        className={`absolute z-20 transition-transform duration-300 ease-in-out ${
          isMobile
            ? `bottom-0 left-0 right-0 ${view === 'canvas' && panelVisible ? 'translate-y-0' : 'translate-y-full'}`
            : `top-0 right-0 h-full ${view === 'canvas' && panelVisible ? 'translate-x-0' : 'translate-x-full'}`
        }`}
        style={{ pointerEvents: view === 'canvas' && panelVisible ? 'auto' : 'none' }}
      >
        {/* Visual drag handle */}
        <div className="md:hidden flex justify-center items-center h-8 bg-white rounded-t-2xl">
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>
        <PurchasePanel
          selection={selection}
          clickedPurchase={clickedPurchase}
          fillType={fillType}
          color={color}
          imageUrl={imageUrl}
          onFillTypeChange={setFillType}
          onColorChange={setColor}
          onImageUrlChange={setImageUrl}
          onPurchased={fetchPurchases}
          onNewPurchase={handleNewPurchase}
          onClose={handleCollapsePanel}
          onClearSelection={handleClearSelection}
        />
      </div>
    </main>
  );
}
