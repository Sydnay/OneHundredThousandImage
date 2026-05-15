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

  return (
    <main className="flex h-screen overflow-hidden bg-slate-100">
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
        onClearSelection={handleClearSelection}
      />
    </main>
  );
}
