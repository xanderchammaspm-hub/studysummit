/**
 * Holographic "Exam Engine" mark — glass document with a neural-network of
 * electric-yellow nodes on neon-purple circuitry.
 */
export function ExamEngineLogo({
  size = 56,
  animate = true,
  className,
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const uid = `ee-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Summit Exam Engine"
    >
      <defs>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.35 0.14 300 / 0.85)" />
          <stop offset="100%" stopColor="oklch(0.2 0.08 290 / 0.6)" />
        </linearGradient>
        <linearGradient id={`${uid}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.22 300)" />
          <stop offset="100%" stopColor="oklch(0.9 0.14 82)" />
        </linearGradient>
        <radialGradient id={`${uid}-core`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFCDB" />
          <stop offset="45%" stopColor="oklch(0.92 0.15 95)" />
          <stop offset="100%" stopColor="oklch(0.9 0.14 82 / 0)" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glass document */}
      <g transform="rotate(-6 32 32)">
        <rect
          x="14"
          y="8"
          width="36"
          height="48"
          rx="6"
          fill={`url(#${uid}-glass)`}
          stroke={`url(#${uid}-edge)`}
          strokeWidth="1.6"
          style={{ filter: "drop-shadow(0 0 8px oklch(0.7 0.22 300 / 0.7))" }}
        />
        <rect x="14" y="8" width="36" height="16" rx="6" fill="oklch(0.95 0.02 300 / 0.06)" />

        {/* Neural circuitry */}
        <g
          stroke="oklch(0.75 0.2 300)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        >
          <path d="M21 19 L32 32 L43 19" />
          <path d="M21 45 L32 32 L43 45" />
          <path d="M20 32 H44" />
          <path d="M21 19 H43" />
          <path d="M21 45 H43" />
        </g>

        {/* Nodes */}
        {[
          [21, 19],
          [43, 19],
          [21, 45],
          [43, 45],
          [20, 32],
          [44, 32],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill="oklch(0.92 0.15 92)"
            filter={`url(#${uid}-glow)`}
            style={
              animate
                ? { animation: `nodePulse 2.4s ease-in-out ${i * 0.22}s infinite` }
                : undefined
            }
          />
        ))}

        {/* Focal node */}
        <circle cx="32" cy="32" r="9" fill={`url(#${uid}-core)`} opacity="0.85" />
        <circle
          cx="32"
          cy="32"
          r="3.4"
          fill="#FFFCDB"
          filter={`url(#${uid}-glow)`}
          style={animate ? { animation: "nodePulse 1.8s ease-in-out infinite" } : undefined}
        />
      </g>
    </svg>
  );
}
