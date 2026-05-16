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

  // Block pull-to-refresh / iOS rubber-band when panel is open.
  // Allow aside scroll only when it has content to scroll in that direction.
  // Detect swipe-down-to-dismiss when aside is at scrollTop 0.
  useEffect(() => {
    let startY = 0;
    let startTarget: EventTarget | null = null;

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startTarget = e.target;
    };

    const onMove = (e: TouchEvent) => {
      if (!panelVisibleRef.current || !isMobileRef.current) return;

      const panelEl = panelElRef.current;
      if (!panelEl) return;
      const aside = panelEl.querySelector('aside');
      const dy = e.touches[0].clientY - startY;

      if (aside && aside.contains(startTarget as Node)) {
        const canScrollDown = aside.scrollTop < aside.scrollHeight - aside.clientHeight;
        const canScrollUp = aside.scrollTop > 0;
        // Allow natural scroll if aside can scroll that way
        if ((dy < 0 && canScrollDown) || (dy > 0 && canScrollUp)) return;
      }

      e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!panelVisibleRef.current || !isMobileRef.current) return;

      const panelEl = panelElRef.current;
      if (!panelEl) return;
      const aside = panelEl.querySelector('aside');
      const dy = e.changedTouches[0].clientY - startY;

      // Dismiss when swiping down anywhere in panel and aside is at top
      const atTop = !aside || aside.scrollTop === 0;
      if (dy > 80 && atTop && panelEl.contains(startTarget as Node)) {
        setPanelCollapsed(true);
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
            {isMobile && (
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

      {/* Backdrop — tap outside panel to collapse */}
      {panelVisible && isMobile && (
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
            ? `bottom-0 left-0 right-0 ${panelVisible ? 'translate-y-0' : 'translate-y-full'}`
            : `top-0 right-0 h-full ${panelVisible ? 'translate-x-0' : 'translate-x-full'}`
        }`}
        style={{ pointerEvents: panelVisible ? 'auto' : 'none' }}
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
          onClose={handleCollapsePanel}
          onClearSelection={handleClearSelection}
        />
      </div>
    </main>
  );
}
