'use client';

import { useState, useEffect } from 'react';
import type { NormalizedSelection, Purchase } from '@/lib/types';
import { PRICE_PER_CELL, formatRub } from '@/lib/pricing';
import ColorPicker from './ColorPicker';
import ImageUploader from './ImageUploader';

interface Props {
  selection: NormalizedSelection | null;
  clickedPurchase: Purchase | null;
  fillType: 'color' | 'image';
  color: string;
  imageUrl: string;
  onFillTypeChange: (v: 'color' | 'image') => void;
  onColorChange: (v: string) => void;
  onImageUrlChange: (v: string) => void;
  onPurchased: () => void;
  onNewPurchase: (purchase: Purchase) => void;
  onClose: () => void;
  onClearSelection: () => void;
}

export default function PurchasePanel({
  selection, clickedPurchase,
  fillType, color, imageUrl,
  onFillTypeChange, onColorChange, onImageUrlChange,
  onPurchased, onNewPurchase, onClose, onClearSelection,
}: Props) {
  const [label, setLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Edit mode for clicked purchases
  const [editing, setEditing] = useState(false);
  const [editFillType, setEditFillType] = useState<'color' | 'image'>('color');
  const [editColor, setEditColor] = useState('#6366f1');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Reset edit state whenever the clicked purchase changes
  useEffect(() => {
    setEditing(false);
    setEditError(null);
    setEditSuccess(false);
  }, [clickedPurchase?.id]);

  const startEditing = () => {
    if (!clickedPurchase) return;
    setEditFillType(clickedPurchase.fill_type);
    setEditColor(clickedPurchase.color ?? '#6366f1');
    setEditImageUrl(clickedPurchase.image_url ?? '');
    setEditLabel(clickedPurchase.label ?? '');
    setEditLinkUrl(clickedPurchase.link_url ?? '');
    setEditError(null);
    setEditSuccess(false);
    setEditing(true);
  };

  const handleUpdate = async () => {
    if (!clickedPurchase) return;
    if (editFillType === 'image' && !editImageUrl) {
      setEditError('Сначала загрузите изображение.');
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/purchase/${clickedPurchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fill_type: editFillType,
          color: editFillType === 'color' ? editColor : undefined,
          image_url: editFillType === 'image' ? editImageUrl : undefined,
          label: editLabel || undefined,
          link_url: editLinkUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? 'Не удалось обновить'); return; }
      setEditSuccess(true);
      onPurchased();
      setTimeout(() => { setEditSuccess(false); setEditing(false); }, 1500);
    } catch {
      setEditError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selection) return;
    if (fillType === 'image' && !imageUrl) {
      setError('Сначала загрузите изображение.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Укажите корректный email — на него придёт чек.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: selection.x,
          y: selection.y,
          width: selection.width,
          height: selection.height,
          fill_type: fillType,
          color: fillType === 'color' ? color : undefined,
          image_url: fillType === 'image' ? imageUrl : undefined,
          label: label || undefined,
          link_url: linkUrl || undefined,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Не удалось оформить'); return; }
      window.location.href = data.checkoutUrl;
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors';

  return (
    <aside className="w-screen md:w-72 max-h-[75vh] md:max-h-none md:h-full flex flex-col bg-white border-t md:border-t-0 md:border-l border-zinc-200 md:rounded-none overflow-y-auto overscroll-y-contain shadow-xl md:shadow-none" style={{ touchAction: 'pan-y' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-zinc-900">Million Dollar Grid</h1>
          <p className="text-xs text-zinc-400 mt-0.5">1000 × 1000 · {PRICE_PER_CELL} ₽ за клетку</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors text-base leading-none"
          title="Закрыть"
        >×</button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Default state */}
        {!selection && !clickedPurchase && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Выделите область на сетке мышью. Каждая клетка стоит{' '}
              <span className="text-zinc-800 font-medium">{PRICE_PER_CELL} ₽</span>.
              Ваше изображение или цвет останется здесь навсегда. Всего 1 000 000 клеток.
            </p>
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-3 text-xs space-y-2">
              <div className="flex justify-between"><span className="text-zinc-400">Размер сетки</span><span className="text-zinc-700 font-medium">1000 × 1000</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Всего клеток</span><span className="text-zinc-700 font-medium">1 000 000</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Цена за клетку</span><span className="text-zinc-700 font-medium">{PRICE_PER_CELL} ₽</span></div>
            </div>
            <p className="text-xs text-zinc-300">
              Колёсико — масштаб · Пробел + перетаскивание — сдвиг · правый клик — отмена
            </p>
          </div>
        )}

        {/* Clicked purchase info */}
        {clickedPurchase && !selection && !editing && (
          <div className="space-y-3">
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-3 space-y-2">
              <p className="text-xs font-medium text-zinc-700">Купленная область</p>
              <div className="text-xs text-zinc-400 space-y-1.5">
                <div className="flex justify-between"><span>Позиция</span><span className="text-zinc-600">{clickedPurchase.x}, {clickedPurchase.y}</span></div>
                <div className="flex justify-between"><span>Размер</span><span className="text-zinc-600">{clickedPurchase.width} × {clickedPurchase.height}</span></div>
                {clickedPurchase.label && (
                  <div className="flex justify-between"><span>Подпись</span><span className="text-zinc-600 truncate ml-2">{clickedPurchase.label}</span></div>
                )}
              </div>
              {clickedPurchase.link_url && (
                (() => {
                  try { new URL(clickedPurchase.link_url); return (
                    <a href={clickedPurchase.link_url} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-indigo-500 hover:text-indigo-600 truncate mt-1">
                      {clickedPurchase.link_url}
                    </a>
                  ); } catch { return (
                    <p className="text-xs text-zinc-500 mt-1 break-words">{clickedPurchase.link_url}</p>
                  ); }
                })()
              )}
            </div>
            <button
              onClick={startEditing}
              className="w-full py-2 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-700 font-medium"
            >
              Редактировать область
            </button>
          </div>
        )}

        {/* Edit form for clicked purchase */}
        {clickedPurchase && !selection && editing && (
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-3 text-xs space-y-1.5 text-zinc-400">
              <div className="flex justify-between"><span>Позиция</span><span className="text-zinc-600">{clickedPurchase.x}, {clickedPurchase.y}</span></div>
              <div className="flex justify-between"><span>Размер</span><span className="text-zinc-600">{clickedPurchase.width} × {clickedPurchase.height}</span></div>
            </div>

            <div className="flex bg-zinc-100 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setEditFillType('color')}
                className={`flex-1 py-1.5 rounded-md transition-all font-medium ${editFillType === 'color' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >Цвет</button>
              <button
                onClick={() => setEditFillType('image')}
                className={`flex-1 py-1.5 rounded-md transition-all font-medium ${editFillType === 'image' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >Изображение</button>
            </div>

            {editFillType === 'color' ? (
              <ColorPicker value={editColor} onChange={setEditColor} />
            ) : (
              <ImageUploader onUpload={setEditImageUrl} value={editImageUrl} />
            )}

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Подпись <span className="text-zinc-300">(необязательно)</span></label>
                <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)}
                  placeholder="Ваше имя или бренд" maxLength={60} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Ссылка или текст <span className="text-zinc-300">(необязательно)</span></label>
                <input type="text" value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)}
                  placeholder="https://ваш-сайт.ру или любой текст" maxLength={150} className={inputCls} />
              </div>
            </div>

            {editError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{editError}</p>
            )}
            {editSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">Сохранено!</p>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={handleUpdate}
                disabled={editLoading || editSuccess}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
              >
                {editLoading ? 'Сохранение…' : editSuccess ? 'Сохранено!' : 'Сохранить изменения'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="w-full py-2 px-4 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Purchase form */}
        {selection && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Область</span>
                <span className="text-zinc-700 font-medium">{selection.width} × {selection.height} клеток</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Позиция</span>
                <span className="text-zinc-600">({selection.x}, {selection.y})</span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2 mt-1">
                <span className="text-zinc-700 font-medium">Итого</span>
                <span className="text-zinc-900 font-bold">{formatRub(selection.totalPrice)}</span>
              </div>
            </div>

            {/* Fill type tabs */}
            <div className="flex bg-zinc-100 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => onFillTypeChange('color')}
                className={`flex-1 py-1.5 rounded-md transition-all font-medium ${fillType === 'color' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Цвет
              </button>
              <button
                onClick={() => onFillTypeChange('image')}
                className={`flex-1 py-1.5 rounded-md transition-all font-medium ${fillType === 'image' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                Изображение
              </button>
            </div>

            {/* Fill content */}
            {fillType === 'color' ? (
              <ColorPicker value={color} onChange={onColorChange} />
            ) : (
              <ImageUploader onUpload={onImageUrlChange} value={imageUrl} />
            )}

            {/* Metadata */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Подпись <span className="text-zinc-300">(необязательно)</span></label>
                <input type="text" value={label} onChange={e => setLabel(e.target.value)}
                  placeholder="Ваше имя или бренд" maxLength={60} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Ссылка или текст <span className="text-zinc-300">(необязательно)</span></label>
                <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://ваш-сайт.ру или любой текст" maxLength={150} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Email <span className="text-zinc-300">(для чека)</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" maxLength={120} className={inputCls} />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                Область куплена! Она появилась на сетке.
              </p>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={handlePurchase}
                disabled={loading || success}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
              >
                {loading ? 'Переход к оплате…' : `Оплатить ${formatRub(selection.totalPrice)}`}
              </button>
              <button
                onClick={onClearSelection}
                className="w-full py-2 px-4 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Отменить выделение
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
