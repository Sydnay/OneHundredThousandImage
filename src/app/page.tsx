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
  }, []);

  const panelOpen = !!(selection || clickedPurchase);

  return (
    <main className="flex h-screen overflow-hidden bg-slate-100 relative">
      <div className="flex-1 relative overflow-hidden">
        <PixelCanvas
          purchases={purchases}
          selection={selection}
          fillType={fillType}
          color={color}
          imageUrl={imageUrl}
          onSelectionChange={handleSelectionChange}
          onPurchaseClick={handlePurchaseClick}
        />

        {/* Hint — visible only when nothing selected */}
        {!panelOpen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full px-4 py-2 text-xs text-zinc-500 shadow-sm">
              Drag to select an area · scroll to zoom · click a purchased area to view
            </div>
          </div>
        )}
      </div>

      {/* Sliding panel */}
      <div
        className="absolute right-0 top-0 h-full z-20 transition-transform duration-300 ease-in-out"
        style={{ transform: panelOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
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
      </div>
    </main>
  );
}
