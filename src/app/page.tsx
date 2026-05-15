'use client';

import { useState, useCallback, useEffect } from 'react';
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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
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
  }, []);

  const handlePurchaseClick = useCallback((purchase: Purchase) => {
    setClickedPurchase(purchase);
    setSelection(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelection(null);
    setClickedPurchase(null);
    setSelectMode(false);
  }, []);

  const panelOpen = !!(selection || clickedPurchase);

  const panel = (
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
      onClearSelection={handleClearSelection}
    />
  );

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

        {/* Hint + mobile select button */}
        {!panelOpen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
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
            <div className="pointer-events-none bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full px-4 py-2 text-xs text-zinc-500 shadow-sm whitespace-nowrap">
              {isMobile ? 'Pinch to zoom · tap to view' : 'Drag to select · scroll to zoom · click to view'}
            </div>
          </div>
        )}
      </div>

      {/* Panel — slides from right on desktop, from bottom on mobile */}
      <div
        className="absolute z-20 transition-transform duration-300 ease-in-out"
        style={{
          ...(isMobile
            ? { bottom: 0, left: 0, right: 0, transform: panelOpen ? 'translateY(0)' : 'translateY(100%)' }
            : { top: 0, right: 0, height: '100%', transform: panelOpen ? 'translateX(0)' : 'translateX(100%)' }
          ),
        }}
      >
        {panel}
      </div>
    </main>
  );
}
