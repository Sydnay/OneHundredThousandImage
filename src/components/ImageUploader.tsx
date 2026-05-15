'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  onUpload: (url: string) => void;
  value?: string;
}

type Tab = 'file' | 'url';

export default function ImageUploader({ onUpload, value }: Props) {
  const [tab, setTab] = useState<Tab>('file');
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setImage = (url: string) => {
    setPreview(url);
    onUpload(url);
    setError(null);
  };

  const clear = () => {
    setPreview(null);
    setUrlInput('');
    onUpload('');
    setError(null);
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setImage(data.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUpload]);

  const tryLoadUrl = useCallback((url: string) => {
    if (!url) return;
    setUrlLoading(true);
    setError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { setUrlLoading(false); setImage(url); };
    img.onerror = () => { setUrlLoading(false); setError('Could not load image from that URL.'); };
    img.src = url;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUpload]);

  useEffect(() => {
    if (tab !== 'url' || !urlInput.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => tryLoadUrl(urlInput.trim()), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [urlInput, tab, tryLoadUrl]);

  const tabCls = (t: Tab) =>
    `flex-1 py-1.5 rounded-md transition-all text-xs font-medium ${tab === t ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`;

  return (
    <div className="space-y-2">
      <div className="flex bg-zinc-100 rounded-lg p-0.5">
        <button onClick={() => { setTab('file'); setError(null); }} className={tabCls('file')}>Upload file</button>
        <button onClick={() => { setTab('url'); setError(null); }} className={tabCls('url')}>Paste URL</button>
      </div>

      {preview && (
        <div className="space-y-1.5">
          <div className="relative w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50" style={{ aspectRatio: '16/9' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
            <button
              onClick={clear}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 hover:bg-white border border-zinc-200 text-zinc-500 text-xs flex items-center justify-center shadow-sm"
              title="Remove"
            >×</button>
          </div>
          {tab === 'url' && (
            <input
              type="url" value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setPreview(null); onUpload(''); }}
              placeholder="Paste a different URL…"
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          )}
        </div>
      )}

      {tab === 'file' && !preview && (
        <div
          className="w-full h-24 border-2 border-dashed border-zinc-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className="text-xs text-zinc-400">Uploading…</span>
          ) : (
            <span className="text-xs text-zinc-400 text-center px-2">
              Drop image here or <span className="text-indigo-500">click to browse</span>
              <br />
              <span className="text-zinc-300 text-[11px]">JPEG, PNG, GIF, WebP — max 5 MB</span>
            </span>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {tab === 'url' && !preview && (
        <div className="relative">
          <input
            type="url" value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onPaste={e => {
              const items = e.clipboardData?.items;
              if (!items) return;
              for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                  e.preventDefault();
                  const file = item.getAsFile();
                  if (file) handleFile(file);
                  return;
                }
              }
            }}
            placeholder="https://example.com/image.png"
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors pr-8"
          />
          {urlLoading && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px]">…</span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
