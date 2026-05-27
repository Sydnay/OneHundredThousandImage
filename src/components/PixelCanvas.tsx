'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Purchase, NormalizedSelection } from '@/lib/types';
import { priceForCells } from '@/lib/pricing';

const COLS = 1000;
const ROWS = 1000;
const CELL = 3;
const GRID_W = COLS * CELL;
const GRID_H = ROWS * CELL;
const EDGE_THRESH = 8; // px from edge to trigger resize cursor

interface Props {
  purchases: Purchase[];
  selection: NormalizedSelection | null;
  fillType: 'color' | 'image';
  color: string;
  imageUrl: string;
  selectMode: boolean;
  onSelectionChange: (sel: NormalizedSelection | null) => void;
  onPurchaseClick: (purchase: Purchase) => void;
}

interface Edge { n: boolean; s: boolean; e: boolean; w: boolean }

const isGifUrl = (url: string) => /\.gif($|\?)/i.test(url);

function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
  const x = Math.max(0, Math.min(x1, x2));
  const y = Math.max(0, Math.min(y1, y2));
  const x2c = Math.min(COLS - 1, Math.max(x1, x2));
  const y2c = Math.min(ROWS - 1, Math.max(y1, y2));
  return { x, y, w: x2c - x + 1, h: y2c - y + 1 };
}

function edgeToCursor({ n, s, e, w }: Edge): string {
  if (n && w) return 'nw-resize';
  if (n && e) return 'ne-resize';
  if (s && w) return 'sw-resize';
  if (s && e) return 'se-resize';
  if (n || s) return 'ns-resize';
  if (e || w) return 'ew-resize';
  return 'crosshair';
}

export default function PixelCanvas({ purchases, selection, fillType, color, imageUrl, selectMode, onSelectionChange, onPurchaseClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gifLayerRef = useRef<HTMLDivElement>(null);
  const gifImgMapRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const previewGifImgRef = useRef<HTMLImageElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipPurchaseIdRef = useRef<number | null>(null);
  const imageCache = useRef<Map<string, HTMLImageElement | null>>(new Map());
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const previewUrlRef = useRef<string>('');

  // Props → refs so draw loop / callbacks can read latest values without deps
  const fillTypeRef = useRef(fillType);
  const colorRef = useRef(color);
  const imageUrlRef = useRef(imageUrl);
  const selectionRef = useRef(selection);

  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Drag new selection
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const dragEndRef = useRef<{ cellX: number; cellY: number } | null>(null);

  // Resize existing selection
  const isResizingRef = useRef(false);
  const resizeEdgeRef = useRef<Edge | null>(null);
  const resizeOrigRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Pan
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const hoverCellRef = useRef<{ cellX: number; cellY: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const rafRef = useRef<number>(0);
  const purchasesRef = useRef<Purchase[]>(purchases);
  const dprRef = useRef(1);
  const selectModeRef = useRef(selectMode);

  // Touch state
  const touchRef = useRef<{
    type: 'pan' | 'pinch' | 'select';
    startX: number; startY: number; moved: boolean;
    pinchStartDist?: number; pinchStartScale?: number;
  } | null>(null);

  // ── sync refs with props ──────────────────────────────────────────────────

  useEffect(() => {
    purchasesRef.current = purchases;
    const gifLayer = gifLayerRef.current;
    const gifImgMap = gifImgMapRef.current;

    // Remove GIF overlay imgs for purchases no longer present
    const activeGifIds = new Set(
      purchases
        .filter(p => p.fill_type === 'image' && p.image_url && isGifUrl(p.image_url))
        .map(p => p.id)
    );
    gifImgMap.forEach((img, id) => {
      if (!activeGifIds.has(id)) { img.remove(); gifImgMap.delete(id); }
    });

    purchases.forEach(p => {
      if (p.fill_type !== 'image' || !p.image_url) return;
      if (isGifUrl(p.image_url)) {
        if (!gifImgMap.has(p.id) && gifLayer) {
          const img = document.createElement('img');
          img.src = p.image_url;
          img.alt = '';
          img.style.cssText = 'position:absolute;pointer-events:none;image-rendering:pixelated;';
          gifLayer.appendChild(img);
          gifImgMap.set(p.id, img);
        }
      } else if (!imageCache.current.has(p.image_url)) {
        // If this URL matches the current preview image, use it immediately
        if (p.image_url === previewUrlRef.current && previewImageRef.current) {
          imageCache.current.set(p.image_url, previewImageRef.current);
        } else {
          imageCache.current.set(p.image_url, null);
          const img = new Image();
          img.onload = () => { imageCache.current.set(p.image_url!, img); };
          img.onerror = () => { console.error('[canvas] failed to load purchase image:', p.image_url); };
          img.src = p.image_url;
        }
      }
    });
  }, [purchases]);

  useEffect(() => { fillTypeRef.current = fillType; }, [fillType]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { selectModeRef.current = selectMode; }, [selectMode]);
  useEffect(() => {
    selectionRef.current = selection;
    // When selection is set/updated externally, sync drag refs so resize hit-test matches
    if (selection) {
      dragStartRef.current = { cellX: selection.x, cellY: selection.y };
      dragEndRef.current   = { cellX: selection.x + selection.width - 1, cellY: selection.y + selection.height - 1 };
    } else {
      dragStartRef.current = null;
      dragEndRef.current   = null;
    }
  }, [selection]);

  useEffect(() => {
    imageUrlRef.current = imageUrl;
    const gifImg = previewGifImgRef.current;
    if (!imageUrl) {
      previewImageRef.current = null;
      previewUrlRef.current = '';
      if (gifImg) { gifImg.src = ''; gifImg.style.display = 'none'; }
      return;
    }
    if (imageUrl === previewUrlRef.current) return;
    previewUrlRef.current = imageUrl;
    previewImageRef.current = null;
    if (gifImg) {
      if (isGifUrl(imageUrl)) { gifImg.src = imageUrl; }
      else { gifImg.src = ''; gifImg.style.display = 'none'; }
    }
    const img = new Image();
    img.onload = () => { previewImageRef.current = img; };
    img.onerror = () => { console.error('[canvas] failed to load preview image:', imageUrl); };
    img.src = imageUrl;
  }, [imageUrl]);

  // Create the preview GIF img element once on mount
  useEffect(() => {
    const gifLayer = gifLayerRef.current;
    if (!gifLayer) return;
    const img = document.createElement('img');
    img.alt = '';
    img.style.cssText = 'position:absolute;pointer-events:none;image-rendering:pixelated;display:none;opacity:0.9;';
    gifLayer.appendChild(img);
    previewGifImgRef.current = img;
    return () => { img.remove(); previewGifImgRef.current = null; };
  }, []);

  // ── coordinate helpers ────────────────────────────────────────────────────

  const screenToCell = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = (screenX - rect.left - offsetRef.current.x) / scaleRef.current;
    const sy = (screenY - rect.top  - offsetRef.current.y) / scaleRef.current;
    const cellX = Math.floor(sx / CELL);
    const cellY = Math.floor(sy / CELL);
    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return null;
    return { cellX, cellY };
  }, []);

  /** Returns which edges of the current selection the mouse is near, or null */
  const getResizeEdge = useCallback((screenX: number, screenY: number): Edge | null => {
    const sel = selectionRef.current;
    const canvas = canvasRef.current;
    if (!sel || !canvas) return null;

    const rect   = canvas.getBoundingClientRect();
    const scale  = scaleRef.current;
    const { x: ox, y: oy } = offsetRef.current;

    const left   = sel.x             * CELL * scale + ox + rect.left;
    const top    = sel.y             * CELL * scale + oy + rect.top;
    const right  = (sel.x + sel.width)  * CELL * scale + ox + rect.left;
    const bottom = (sel.y + sel.height) * CELL * scale + oy + rect.top;

    // Must be within the bounding box (with threshold) to trigger
    if (screenX < left  - EDGE_THRESH || screenX > right  + EDGE_THRESH) return null;
    if (screenY < top   - EDGE_THRESH || screenY > bottom + EDGE_THRESH) return null;

    const n = Math.abs(screenY - top)    < EDGE_THRESH;
    const s = Math.abs(screenY - bottom) < EDGE_THRESH;
    const w = Math.abs(screenX - left)   < EDGE_THRESH;
    const e = Math.abs(screenX - right)  < EDGE_THRESH;

    if (!n && !s && !e && !w) return null;
    return { n, s, e, w };
  }, []);

  // ── draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: ox, y: oy } = offsetRef.current;
    const scale = scaleRef.current;
    const dpr = dprRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, cw, ch);

    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);

    // Grid with shadow
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 24 / scale;
    ctx.shadowOffsetY = 4 / scale;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, GRID_W, GRID_H);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
    ctx.shadowOffsetY = 0;

    // Purchases
    for (const p of purchasesRef.current) {
      const px = p.x * CELL, py = p.y * CELL;
      const pw = p.width * CELL, ph = p.height * CELL;
      if (p.fill_type === 'color' && p.color) {
        ctx.fillStyle = p.color;
        ctx.fillRect(px, py, pw, ph);
      } else if (p.fill_type === 'image' && p.image_url) {
        if (isGifUrl(p.image_url)) {
          // GIF: rendered as overlay img — skip canvas drawing
        } else {
          const img = imageCache.current.get(p.image_url);
          if (img) ctx.drawImage(img, px, py, pw, ph);
          else { ctx.fillStyle = '#e4e4e7'; ctx.fillRect(px, py, pw, ph); }
        }
      }
    }

    // Sync GIF overlay img positions with current transform
    const gifImgMap = gifImgMapRef.current;
    for (const p of purchasesRef.current) {
      if (p.fill_type !== 'image' || !p.image_url || !isGifUrl(p.image_url)) continue;
      const img = gifImgMap.get(p.id);
      if (!img) continue;
      img.style.left   = `${p.x * CELL * scale + ox}px`;
      img.style.top    = `${p.y * CELL * scale + oy}px`;
      img.style.width  = `${p.width  * CELL * scale}px`;
      img.style.height = `${p.height * CELL * scale}px`;
    }

    // Grid lines at high zoom
    if (scale > 2.5) {
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 0.5 / scale;
      for (let col = 0; col <= COLS; col++) {
        ctx.beginPath(); ctx.moveTo(col * CELL, 0); ctx.lineTo(col * CELL, GRID_H); ctx.stroke();
      }
      for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath(); ctx.moveTo(0, row * CELL); ctx.lineTo(GRID_W, row * CELL); ctx.stroke();
      }
    }

    // Hover cell
    const hover = hoverCellRef.current;
    if (hover && !isDraggingRef.current && !isResizingRef.current) {
      const hx = hover.cellX * CELL, hy = hover.cellY * CELL;
      ctx.fillStyle = 'rgba(99,102,241,0.28)';
      ctx.fillRect(hx, hy, CELL, CELL);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeRect(hx, hy, CELL, CELL);
    }

    // Active selection + fill preview
    const ds = dragStartRef.current;
    const de = dragEndRef.current;
    if (ds && de) {
      const { x, y, w, h } = normalizeRect(ds.cellX, ds.cellY, de.cellX, de.cellY);
      const px = x * CELL, py = y * CELL, pw = w * CELL, ph = h * CELL;

      const isGifPreview = fillTypeRef.current === 'image' && isGifUrl(imageUrlRef.current);

      // Fill preview
      if (fillTypeRef.current === 'color') {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = colorRef.current;
        ctx.fillRect(px, py, pw, ph);
        ctx.globalAlpha = 1;
      } else if (!isGifPreview) {
        const img = previewImageRef.current;
        if (img) {
          ctx.globalAlpha = 0.9;
          ctx.drawImage(img, px, py, pw, ph);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = 'rgba(99,102,241,0.10)';
          ctx.fillRect(px, py, pw, ph);
        }
      }

      // Border
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeRect(px, py, pw, ph);

      // GIF preview overlay — position animated img over the selection rect
      const gifPreviewImg = previewGifImgRef.current;
      if (gifPreviewImg) {
        if (isGifPreview) {
          gifPreviewImg.style.display = '';
          gifPreviewImg.style.left   = `${x * CELL * scale + ox}px`;
          gifPreviewImg.style.top    = `${y * CELL * scale + oy}px`;
          gifPreviewImg.style.width  = `${w * CELL * scale}px`;
          gifPreviewImg.style.height = `${h * CELL * scale}px`;
        } else {
          gifPreviewImg.style.display = 'none';
        }
      }
    } else {
      // No selection — hide GIF preview
      const gifPreviewImg = previewGifImgRef.current;
      if (gifPreviewImg) gifPreviewImg.style.display = 'none';
    }

    // Grid border
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(0, 0, GRID_W, GRID_H);
  }, []);

  // ── setup ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width  = container.clientWidth  * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width  = container.clientWidth  + 'px';
      canvas.style.height = container.clientHeight + 'px';
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const w = container.clientWidth, h = container.clientHeight;
    const initScale = Math.min(w / GRID_W, h / GRID_H) * 0.88;
    scaleRef.current  = initScale;
    offsetRef.current = { x: (w - GRID_W * initScale) / 2, y: (h - GRID_H * initScale) / 2 };

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const clampOffset = useCallback((ox: number, oy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: ox, y: oy };
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const gw = GRID_W * scaleRef.current;
    const gh = GRID_H * scaleRef.current;
    const minX = w * 0.8 - gw, maxX = w * 0.2;
    const minY = h * 0.8 - gh, maxY = h * 0.2;
    return {
      x: minX > maxX ? (w - gw) / 2 : Math.min(maxX, Math.max(minX, ox)),
      y: minY > maxY ? (h - gh) / 2 : Math.min(maxY, Math.max(minY, oy)),
    };
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const minScale = Math.min(canvas.clientWidth / GRID_W, canvas.clientHeight / GRID_H) * 0.85;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(25, Math.max(minScale, scaleRef.current * factor));
    const rawX = mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current);
    const rawY = my - (my - offsetRef.current.y) * (newScale / scaleRef.current);
    scaleRef.current = newScale;
    offsetRef.current = clampOffset(rawX, rawY);
  }, [clampOffset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        spaceHeldRef.current = true;
      }
    };
    const up   = (e: KeyboardEvent) => { if (e.code === 'Space') spaceHeldRef.current = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── mouse handlers ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || spaceHeldRef.current) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
      return;
    }
    if (e.button !== 0) return;

    // Check resize first
    const edge = getResizeEdge(e.clientX, e.clientY);
    if (edge && selectionRef.current) {
      const sel = selectionRef.current;
      isResizingRef.current = true;
      resizeEdgeRef.current = edge;
      resizeOrigRef.current = { x: sel.x, y: sel.y, w: sel.width, h: sel.height };
      dragStartRef.current  = { cellX: sel.x,                  cellY: sel.y };
      dragEndRef.current    = { cellX: sel.x + sel.width - 1,  cellY: sel.y + sel.height - 1 };
      return;
    }

    // New selection drag
    const cell = screenToCell(e.clientX, e.clientY);
    if (!cell) return;
    isDraggingRef.current = true;
    dragStartRef.current  = cell;
    dragEndRef.current    = cell;
  }, [screenToCell, getResizeEdge]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (isPanningRef.current) {
      const rawX = e.clientX - panStartRef.current.x;
      const rawY = e.clientY - panStartRef.current.y;
      offsetRef.current = clampOffset(rawX, rawY);
      if (canvas) canvas.style.cursor = 'grabbing';
      return;
    }

    if (isResizingRef.current) {
      const cell = screenToCell(e.clientX, e.clientY);
      if (!cell) return;
      const orig = resizeOrigRef.current!;
      const edge = resizeEdgeRef.current!;
      let startX = orig.x, startY = orig.y;
      let endX   = orig.x + orig.w - 1;
      let endY   = orig.y + orig.h - 1;

      if (edge.e) endX   = Math.max(startX, Math.min(COLS - 1, cell.cellX));
      if (edge.w) startX = Math.min(endX,   Math.max(0,        cell.cellX));
      if (edge.s) endY   = Math.max(startY, Math.min(ROWS - 1, cell.cellY));
      if (edge.n) startY = Math.min(endY,   Math.max(0,        cell.cellY));

      dragStartRef.current = { cellX: startX, cellY: startY };
      dragEndRef.current   = { cellX: endX,   cellY: endY   };
      return;
    }

    if (isDraggingRef.current) {
      const cell = screenToCell(e.clientX, e.clientY);
      if (cell) dragEndRef.current = cell;
      if (canvas) canvas.style.cursor = 'crosshair';
      return;
    }

    // Hover — update cursor based on proximity to selection edges or link
    const cell = screenToCell(e.clientX, e.clientY);
    hoverCellRef.current = cell;

    const tooltip = tooltipRef.current;
    const container = containerRef.current;

    if (canvas) {
      const edge = getResizeEdge(e.clientX, e.clientY);
      if (edge) {
        canvas.style.cursor = edgeToCursor(edge);
        if (tooltip) tooltip.style.opacity = '0';
        tooltipPurchaseIdRef.current = null;
      } else if (cell) {
        const linked = purchasesRef.current.find(p =>
          p.link_url &&
          cell.cellX >= p.x && cell.cellX < p.x + p.width &&
          cell.cellY >= p.y && cell.cellY < p.y + p.height
        );
        const linkedIsUrl = linked ? (() => { try { const u = new URL(linked.link_url!); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } })() : false;
        canvas.style.cursor = linkedIsUrl ? 'pointer' : 'crosshair';

        if (linked && tooltip && container) {
          // Position tooltip relative to container
          const cRect = container.getBoundingClientRect();
          let tx = e.clientX - cRect.left + 20;
          let ty = e.clientY - cRect.top + 20;
          // Flip if near right/bottom edge
          if (tx + 220 > cRect.width)  tx = e.clientX - cRect.left - 235;
          if (ty + 110 > cRect.height) ty = e.clientY - cRect.top  - 120;
          tooltip.style.left = `${tx}px`;
          tooltip.style.top  = `${ty}px`;
          tooltip.style.opacity = '1';

          // Update content only when hovering a different purchase
          if (tooltipPurchaseIdRef.current !== linked.id) {
            tooltipPurchaseIdRef.current = linked.id;
            const favicon  = tooltip.querySelector<HTMLImageElement>('[data-favicon]');
            const domainEl = tooltip.querySelector<HTMLElement>('[data-domain]');
            const labelEl  = tooltip.querySelector<HTMLElement>('[data-label]');
            let isUrl = false;
            try { const u = new URL(linked.link_url!); isUrl = u.protocol === 'http:' || u.protocol === 'https:'; } catch { /* plain text */ }
            if (isUrl) {
              const domain = new URL(linked.link_url!).hostname;
              if (favicon)  { favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`; favicon.style.display = ''; }
              if (domainEl) { domainEl.textContent = domain; domainEl.style.display = ''; }
              if (labelEl)  { labelEl.textContent = linked.label ?? ''; labelEl.style.display = linked.label ? '' : 'none'; }
            } else {
              if (favicon)  { favicon.src = ''; favicon.style.display = 'none'; }
              if (domainEl) { domainEl.textContent = linked.link_url ?? ''; domainEl.style.display = ''; }
              if (labelEl)  { labelEl.textContent = linked.label ?? ''; labelEl.style.display = linked.label ? '' : 'none'; }
            }
          }
        } else if (!linked && tooltip) {
          tooltip.style.opacity = '0';
          tooltipPurchaseIdRef.current = null;
        }
      } else {
        canvas.style.cursor = 'crosshair';
        if (tooltip) tooltip.style.opacity = '0';
        tooltipPurchaseIdRef.current = null;
      }
    }
  }, [screenToCell, getResizeEdge, clampOffset]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1) { isPanningRef.current = false; return; }
    if (isPanningRef.current) { isPanningRef.current = false; return; }

    if (isResizingRef.current) {
      isResizingRef.current = false;
      const ds = dragStartRef.current;
      const de = dragEndRef.current;
      if (ds && de) {
        const { x, y, w, h } = normalizeRect(ds.cellX, ds.cellY, de.cellX, de.cellY);
        onSelectionChange({ x, y, width: w, height: h, cellCount: w * h, totalPrice: priceForCells(w * h) });
      }
      return;
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const ds = dragStartRef.current;
      const de = dragEndRef.current;
      if (ds && de) {
        const { x, y, w, h } = normalizeRect(ds.cellX, ds.cellY, de.cellX, de.cellY);
        if (w === 1 && h === 1) {
          const hit = purchasesRef.current.find(p =>
            x >= p.x && x < p.x + p.width && y >= p.y && y < p.y + p.height
          );
          if (hit) {
            dragStartRef.current = null;
            dragEndRef.current   = null;
            onSelectionChange(null);
            const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
            if (hit.link_url && isUrl(hit.link_url)) {
              window.open(hit.link_url, '_blank', 'noopener,noreferrer');
            } else {
              onPurchaseClick(hit);
            }
            return;
          }
        }
        onSelectionChange({ x, y, width: w, height: h, cellCount: w * h, totalPrice: priceForCells(w * h) });
      }
    }
  }, [onSelectionChange, onPurchaseClick]);

  const handleMouseLeave = useCallback(() => {
    hoverCellRef.current = null;
    if (isPanningRef.current) isPanningRef.current = false;
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
    tooltipPurchaseIdRef.current = null;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = null;
    dragEndRef.current   = null;
    onSelectionChange(null);
  }, [onSelectionChange]);

  // ── touch handlers ────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touches = Array.from(e.touches);
      if (touches.length === 1) {
        const t = touches[0];
        if (selectModeRef.current) {
          const cell = screenToCell(t.clientX, t.clientY);
          if (cell) { isDraggingRef.current = true; dragStartRef.current = cell; dragEndRef.current = cell; }
          touchRef.current = { type: 'select', startX: t.clientX, startY: t.clientY, moved: false };
        } else {
          isPanningRef.current = true;
          panStartRef.current = { x: t.clientX - offsetRef.current.x, y: t.clientY - offsetRef.current.y };
          touchRef.current = { type: 'pan', startX: t.clientX, startY: t.clientY, moved: false };
        }
      } else if (touches.length >= 2) {
        isPanningRef.current = false;
        isDraggingRef.current = false;
        const t1 = touches[0], t2 = touches[1];
        touchRef.current = {
          type: 'pinch',
          startX: (t1.clientX + t2.clientX) / 2,
          startY: (t1.clientY + t2.clientY) / 2,
          moved: false,
          pinchStartDist:  Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
          pinchStartScale: scaleRef.current,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const state = touchRef.current;
      if (!state) return;
      const touches = Array.from(e.touches);

      if (state.type === 'pan' && touches.length === 1) {
        const t = touches[0];
        offsetRef.current = clampOffset(t.clientX - panStartRef.current.x, t.clientY - panStartRef.current.y);
        state.moved = true;
      } else if (state.type === 'select' && touches.length === 1) {
        const cell = screenToCell(touches[0].clientX, touches[0].clientY);
        if (cell) dragEndRef.current = cell;
        state.moved = true;
      } else if (state.type === 'pinch' && touches.length >= 2) {
        const t1 = touches[0], t2 = touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const rect = canvas.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
        const minScale = Math.min(canvas.clientWidth / GRID_W, canvas.clientHeight / GRID_H) * 0.85;
        const newScale = Math.min(25, Math.max(minScale, state.pinchStartScale! * (dist / state.pinchStartDist!)));
        const ratio = newScale / scaleRef.current;
        const newOx = midX - (midX - offsetRef.current.x) * ratio;
        const newOy = midY - (midY - offsetRef.current.y) * ratio;
        scaleRef.current = newScale;
        offsetRef.current = clampOffset(newOx, newOy);
        state.moved = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const state = touchRef.current;
      if (state?.type === 'pan' && !state.moved) {
        const t = e.changedTouches[0];
        const cell = screenToCell(t.clientX, t.clientY);
        if (cell) {
          const hit = purchasesRef.current.find(p =>
            cell.cellX >= p.x && cell.cellX < p.x + p.width &&
            cell.cellY >= p.y && cell.cellY < p.y + p.height
          );
          if (hit) {
            const isUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };
            if (hit.link_url && isUrl(hit.link_url)) window.open(hit.link_url, '_blank', 'noopener,noreferrer');
            else onPurchaseClick(hit);
          }
        }
      } else if (state?.type === 'select') {
        isDraggingRef.current = false;
        const ds = dragStartRef.current, de = dragEndRef.current;
        if (ds && de) {
          const { x, y, w, h } = normalizeRect(ds.cellX, ds.cellY, de.cellX, de.cellY);
          onSelectionChange({ x, y, width: w, height: h, cellCount: w * h, totalPrice: priceForCells(w * h) });
        }
      }
      if (e.touches.length === 0) {
        isPanningRef.current = false;
        touchRef.current = null;
      }
    };

    canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: false });
    return () => {
      canvas.removeEventListener('touchstart',  onTouchStart);
      canvas.removeEventListener('touchmove',   onTouchMove);
      canvas.removeEventListener('touchend',    onTouchEnd);
    };
  }, [clampOffset, screenToCell, onPurchaseClick, onSelectionChange]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      />

      {/* GIF overlay — positioned above canvas so animated GIFs are visible */}
      <div ref={gifLayerRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Link tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none z-50 transition-opacity duration-150"
        style={{ opacity: 0, top: 0, left: 0 }}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 px-4 py-3 w-52">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-favicon src="" alt="" className="w-5 h-5 rounded flex-shrink-0" />
            <span data-domain className="text-xs font-semibold text-zinc-800 truncate" />
          </div>
          <span
            data-label
            className="mt-1.5 text-xs text-zinc-500 block truncate"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
