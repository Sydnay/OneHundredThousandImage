'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import PixelCanvas from '@/components/PixelCanvas';
import PurchasePanel from '@/components/PurchasePanel';
import type { NormalizedSelection, Purchase } from '@/lib/types';

export default function Home() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selection, setSelection] = useState<NormalizedSelection | null>(null);
  const [clickedPurchase, setClickedPurchase] = useState<Purchase | null>(null);

  const [fillType, setFillType] = useState<'color' | 'image'>('color');
  const [color, setColor] = useState('#6366f1');
  const [imageUrl, setImageUrl] = useState('');

  const [selectMode, setSelectMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const panelElRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
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

  const panelOpen = !!(selection || clickedPurchase);
  const panelVisible = panelOpen && !panelCollapsed;

  useEffect(() => {
    panelVisibleRef.current = panelVisible;
  }, [panelVisible]);

  // Block ALL document touchmove when panel is visible on mobile.
  // This prevents pull-to-refresh and iOS rubber-band on ALL devices.
  // Exception: allow vertical scroll inside aside when it can still scroll.
  useEffect(() => {
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (!panelVisibleRef.current || !isMobileRef.current) return;

      const aside = panelElRef.current?.querySelector('aside');
      if (aside && aside.contains(e.target as Node)) {
        const dy = e.touches[0].clientY - startY;
        const scrollingUp = dy < 0; // finger up → see content below
        const scrollingDown = dy > 0; // finger down → see content above
        const canScrollUp = aside.scrollTop < aside.scrollHeight - aside.clientHeight;
        const canScrollDown = aside.scrollTop > 0;
        if ((scrollingUp && canScrollUp) || (scrollingDown && canScrollDown)) {
          return; // let aside scroll naturally
        }
      }

      e.preventDefault();
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
    };
  }, []);

  // Swipe-to-dismiss via drag handle only.
  useEffect(() => {
    const handle = handleRef.current;
    const panelEl = panelElRef.current;
    if (!handle || !panelEl) return;

    let start: { x: number; y: number } | null = null;
    let dragging = false;

    const onStart = (e: TouchEvent) => {
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragging = false;
      panelEl.style.transition = 'none';
    };

    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      const dismissDir = isMobileRef.current ? dy > 8 : dx > 8;
      if (!dragging && dismissDir) dragging = true;
      if (!dragging) return;
      if (isMobileRef.current) panelEl.style.transform = `translateY(${Math.max(0, dy)}px)`;
      else panelEl.style.transform = `translateX(${Math.max(0, dx)}px)`;
    };

    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      panelEl.style.transition = '';
      if (dragging) {
        const dismiss = isMobileRef.current ? dy > 80 : dx > 80;
        if (dismiss) {
          panelEl.style.transform = '';
          setPanelCollapsed(true);
        } else {
          panelEl.style.transform = isMobileRef.current ? 'translateY(0)' : 'translateX(0)';
          setTimeout(() => { if (panelEl) panelEl.style.transform = ''; }, 300);
        }
      } else {
        panelEl.style.transform = '';
      }
      start = null;
      dragging = false;
    };

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', onStart);
      handle.removeEventListener('touchmove', onMove);
      handle.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <main className="flex h-screen overflow-hidden bg-slate-100 relative">
      <div className="flex-1 relative overflow-hidden">
        <PixelCanvas
          purchases={purchases}
          selection={selection}
          fillType={fillType}
          color={color}
          imageUrl={imageUrl}
          selectMode={selectMode}
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
                ↑ Show panel
              </button>
            )}
            {isMobile && !panelOpen && (
              <button
                onClick={() => setSelectMode(v => !v)}
                className={`px-4 py-2 rounded-full text-xs font-medium shadow-md transition-colors ${
                  selectMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/90 text-zinc-700 border border-zinc-200'
                }`}
              >
                {selectMode ? 'Tap & drag to select' : '✏ Select area'}
              </button>
            )}
            {!panelOpen && (
              <div className="pointer-events-none bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full px-4 py-2 text-xs text-zinc-500 shadow-sm whitespace-nowrap">
                {isMobile ? 'Pinch to zoom · tap to view' : 'Drag to select · scroll to zoom · click to view'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel — slides from right on desktop, from bottom on mobile */}
      <div
        ref={panelElRef}
        className="absolute z-20 transition-transform duration-300 ease-in-out"
        style={{
          ...(isMobile
            ? { bottom: 0, left: 0, right: 0, transform: panelVisible ? 'translateY(0)' : 'translateY(100%)' }
            : { top: 0, right: 0, height: '100%', transform: panelVisible ? 'translateX(0)' : 'translateX(100%)' }
          ),
        }}
      >
        <div
          ref={handleRef}
          className="md:hidden flex justify-center items-center h-8 cursor-grab bg-white rounded-t-2xl"
          style={{ touchAction: 'none' }}
        >
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
          onClose={handleCollapsePanel}
          onClearSelection={handleClearSelection}
        />
      </div>
    </main>
  );
}
