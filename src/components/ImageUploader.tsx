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

    const tryDirect = (src: string, onFail: () => void) => {
      const img = new Image();
      img.onload = () => { setUrlLoading(false); setImage(src); };
      img.onerror = onFail;
      img.src = src;
    };

    const tryResolve = () => {
      fetch(`/api/resolve-image?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(data => {
          if (data.url) {
            tryDirect(data.url, () => {
              setUrlLoading(false);
              setError('Could not load image from that URL.');
            });
          } else {
            setUrlLoading(false);
            setError(data.error ?? 'Could not load image from that URL.');
          }
        })
        .catch(() => { setUrlLoading(false); setError('Could not load image from that URL.'); });
    };

    tryDirect(url, tryResolve);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUpload]);

  const isValidUrl = (s: string) => {
    try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch { return false; }
  };

  useEffect(() => {
    if (tab !== 'url' || !urlInput.trim()) { setError(null); return; }
    if (!isValidUrl(urlInput.trim())) return; // not a URL yet — just wait, no error
    setError(null);
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
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin w-5 h-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <span className="text-xs text-zinc-400">Uploading…</span>
            </div>
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
        <div className="space-y-2">
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
          </div>
          {urlLoading && (
            <div className="w-full rounded-lg border border-zinc-100 bg-zinc-50 flex flex-col items-center justify-center gap-2 py-5">
              <svg className="animate-spin w-5 h-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <span className="text-xs text-zinc-400">Loading image…</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
