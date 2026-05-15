'use client';

import { useState, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (sn === 0) { r = g = b = ln; } else {
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1 / 3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorPicker({ value, onChange }: Props) {
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(value));
  const [hexInput, setHexInput] = useState(value);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setHsl([h, s, l]);
    setHexInput(hex);
    onChange(hex);
  }, [onChange]);

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setHsl(hexToHsl(v));
      onChange(v);
    }
  };

  const hueGradient = `linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`;
  const satGradient = `linear-gradient(to right, ${hslToHex(hsl[0], 0, hsl[2])}, ${hslToHex(hsl[0], 100, hsl[2])})`;
  const litGradient = `linear-gradient(to right, #000, ${hslToHex(hsl[0], hsl[1], 50)}, #fff)`;

  return (
    <div className="space-y-3">
      {/* Swatch */}
      <div className="w-full h-10 rounded-lg border border-zinc-200 shadow-inner" style={{ backgroundColor: value }} />

      {/* Sliders */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Hue</label>
          <input type="range" min={0} max={360} value={hsl[0]}
            onChange={e => updateFromHsl(+e.target.value, hsl[1], hsl[2])}
            className="w-full" style={{ background: hueGradient }} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Saturation</label>
          <input type="range" min={0} max={100} value={hsl[1]}
            onChange={e => updateFromHsl(hsl[0], +e.target.value, hsl[2])}
            className="w-full" style={{ background: satGradient }} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Lightness</label>
          <input type="range" min={0} max={100} value={hsl[2]}
            onChange={e => updateFromHsl(hsl[0], hsl[1], +e.target.value)}
            className="w-full" style={{ background: litGradient }} />
        </div>
      </div>

      {/* Hex */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Hex</label>
        <input type="text" value={hexInput} onChange={handleHexInput} maxLength={7}
          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono text-zinc-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors" />
      </div>
    </div>
  );
}
