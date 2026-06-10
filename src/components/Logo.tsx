// Gifmage Store logo — a pixel grid with the centre cell ("your spot") highlighted.
export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Gifmage Store">
      <defs>
        <linearGradient id="gifmageGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#gifmageGrad)" />
      <g fill="#fff">
        <rect x="14"   y="14"   width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="26.75" y="14"   width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="39.5" y="14"   width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="14"   y="26.75" width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="26.75" y="26.75" width="10.5" height="10.5" rx="2.5" />
        <rect x="39.5" y="26.75" width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="14"   y="39.5" width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="26.75" y="39.5" width="10.5" height="10.5" rx="2.5" opacity=".35" />
        <rect x="39.5" y="39.5" width="10.5" height="10.5" rx="2.5" opacity=".35" />
      </g>
    </svg>
  );
}
