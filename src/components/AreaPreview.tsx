'use client';

import { useEffect, useRef } from 'react';
import type { NormalizedSelection } from '@/lib/types';

interface Props {
  selection: NormalizedSelection;
  fillType: 'color' | 'image';
  color: string;
  imageUrl: string;
}

const CHECKER_SIZE = 8;

function drawChecker(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (let y = 0; y < h; y += CHECKER_SIZE) {
    for (let x = 0; x < w; x += CHECKER_SIZE) {
      ctx.fillStyle = ((x / CHECKER_SIZE + y / CHECKER_SIZE) % 2 === 0) ? '#3f3f46' : '#27272a';
      ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
    }
  }
}

export default function AreaPreview({ selection, fillType, color, imageUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: w, height: h } = canvas;

    if (fillType === 'color') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // Image mode
    drawChecker(ctx, w, h);

    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = imageUrl;
  }, [fillType, color, imageUrl]);

  // Keep aspect ratio of selection; max 200px height, fill sidebar width
  const ratio = selection.width / selection.height;
  // Canvas buffer: use 240×N to give decent resolution
  const bufW = 240;
  const bufH = Math.round(bufW / ratio);

  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">Preview on grid</p>
      <div className="w-full rounded-md overflow-hidden border border-zinc-700" style={{ aspectRatio: `${selection.width}/${selection.height}`, maxHeight: 180 }}>
        <canvas
          ref={canvasRef}
          width={bufW}
          height={bufH}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <p className="text-xs text-zinc-600">{selection.width} × {selection.height} cells — image will be stretched to fit</p>
    </div>
  );
}
