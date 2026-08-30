/**
 * "Quick Recall" mark — a glass memory-core hexagon holding a summit-purple
 * brain-circuit with a gold recall bolt. Still (never animated), matching the
 * Exam Engine emblem language.
 */
export function QuickRecallLogo({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const uid = `qr-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Quick Recall"
    >
      <defs>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.35 0.14 300 / 0.82)" />
          <stop offset="100%" stopColor="oklch(0.2 0.08 290 / 0.55)" />
        </linearGradient>
        <linearGradient id={`${uid}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.84 0.19 300)" />
          <stop offset="100%" stopColor="oklch(0.66 0.22 300)" />
        </linearGradient>
        <linearGradient id={`${uid}-core`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="oklch(0.93 0.07 300)" />
          <stop offset="55%" stopColor="oklch(0.74 0.2 300)" />
          <stop offset="100%" stopColor="oklch(0.44 0.16 300)" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0.12 92)" />
          <stop offset="100%" stopColor="oklch(0.84 0.16 78)" />
        </linearGradient>
      </defs>

      {/* Hex memory core */}
      <path
        d="M32 4 L54 16.5 V41.5 L32 54 L10 41.5 V16.5 Z"
        fill={`url(#${uid}-glass)`}
        stroke={`url(#${uid}-edge)`}
        strokeWidth="1.8"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 8px oklch(0.7 0.22 300 / 0.6))" }}
      />
      {/* inner bevel */}
      <path
        d="M32 9.5 L49.2 19.3 V38.7 L32 48.5 L14.8 38.7 V19.3 Z"
        fill="none"
        stroke="oklch(0.9 0.06 300 / 0.28)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Recall nodes + synapse links */}
      <g stroke={`url(#${uid}-core)`} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.95">
        <path d="M20 26 L27 20 M20 26 L21.5 36 M27 20 L38 21.5 M21.5 36 L31 41 M38 21.5 L44 30 M44 30 L31 41" />
      </g>
      <g fill="oklch(0.92 0.07 300)">
        <circle cx="20" cy="26" r="2.4" />
        <circle cx="27" cy="20" r="2" />
        <circle cx="38" cy="21.5" r="2.2" />
        <circle cx="44" cy="30" r="2.4" />
        <circle cx="21.5" cy="36" r="2" />
        <circle cx="31" cy="41" r="2.2" />
      </g>

      {/* Gold recall bolt through the core */}
      <path
        d="M35.5 17 L26.5 32.5 H32.5 L29 47 L41 29.5 H34.5 Z"
        fill={`url(#${uid}-gold)`}
        stroke="oklch(0.98 0.06 95 / 0.85)"
        strokeWidth="0.9"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 5px oklch(0.9 0.14 85 / 0.6))" }}
      />

      {/* Peak hint at the base */}
      <path
        d="M18 45.5 L26 37 L31.5 43 L38.5 34.5 L47 45.5"
        fill="none"
        stroke="oklch(0.86 0.12 300 / 0.5)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default QuickRecallLogo;
