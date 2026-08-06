/**
 * "Summit Exam Engine" mark — glass exam document with a checked verdict badge
 * and a layered summit range, drawn in the app's purple / yellow theme.
 */
export function ExamEngineLogo({
  size = 56,
  animate = false,
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
          <stop offset="0%" stopColor="oklch(0.35 0.14 300 / 0.8)" />
          <stop offset="100%" stopColor="oklch(0.2 0.08 290 / 0.55)" />
        </linearGradient>
        <linearGradient id={`${uid}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.2 300)" />
          <stop offset="100%" stopColor="oklch(0.68 0.22 300)" />
        </linearGradient>
        <linearGradient id={`${uid}-peak`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0.06 300)" />
          <stop offset="55%" stopColor="oklch(0.72 0.2 300)" />
          <stop offset="100%" stopColor="oklch(0.4 0.16 300)" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.9 0.14 82 / 0)" />
          <stop offset="50%" stopColor="oklch(0.9 0.14 82)" />
          <stop offset="100%" stopColor="oklch(0.9 0.14 82 / 0)" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-doc`}>
          <path d="M 13,10 a 5,5 0 0 1 5,-5 h 20 l 13,13 v 33 a 5,5 0 0 1 -5,5 h -28 a 5,5 0 0 1 -5,-5 Z" />
        </clipPath>
      </defs>

      {/* Exam document with folded corner */}
      <path
        d="M 13,10 a 5,5 0 0 1 5,-5 h 20 l 13,13 v 33 a 5,5 0 0 1 -5,5 h -28 a 5,5 0 0 1 -5,-5 Z"
        fill={`url(#${uid}-glass)`}
        stroke={`url(#${uid}-edge)`}
        strokeWidth="1.7"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 7px oklch(0.7 0.22 300 / 0.65))" }}
      />
      <path
        d="M 38,5 v 8 a 5,5 0 0 0 5,5 h 8"
        fill="none"
        stroke={`url(#${uid}-edge)`}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Question lines with bullet dots */}
      <g stroke="oklch(0.9 0.05 300 / 0.85)" strokeWidth="2.1" strokeLinecap="round">
        <path d="M 20,15 H 33" />
        <path d="M 24,23 H 38" />
        <path d="M 24,29 H 38" />
        <path d="M 24,35 H 34" />
      </g>
      <g fill="oklch(0.9 0.05 300 / 0.8)">
        <circle cx="20" cy="23" r="1.7" />
        <circle cx="20" cy="29" r="1.7" />
        <circle cx="20" cy="35" r="1.7" />
      </g>

      {/* Verdict badge */}
      <g filter={`url(#${uid}-glow)`} style={animate ? { animation: "nodePulse 2.6s ease-in-out infinite" } : undefined}>
        <circle
          cx="45"
          cy="27"
          r="8.5"
          fill="oklch(0.2 0.08 290 / 0.8)"
          stroke="oklch(0.9 0.14 82)"
          strokeWidth="1.6"
        />
        <path
          d="M 41,27.5 l 3,3.2 l 6,-7"
          fill="none"
          stroke="oklch(0.92 0.15 92)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Summit range across the lower half */}
      <g clipPath={`url(#${uid}-doc)`}>
        <path
          d="M 6,56 L 20,38 L 27,46 L 32,40 L 44,56 Z"
          fill={`url(#${uid}-peak)`}
          opacity="0.75"
        />
        <path d="M 22,56 L 36,30 L 52,56 Z" fill={`url(#${uid}-peak)`} />
        <path
          d="M 36,30 L 41,38 L 38,37 L 36,40 L 33.5,36.5 L 31,38 Z"
          fill="oklch(0.97 0.02 300)"
        />
      </g>

      {/* Flag + ground arc */}
      <g style={animate ? { animation: "nodePulse 3.2s ease-in-out 0.4s infinite" } : undefined}>
        <path d="M 36,30 v -8" stroke="oklch(0.9 0.14 82)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 36,22 l 6,2.2 l -6,2.4 Z" fill="oklch(0.92 0.15 92)" filter={`url(#${uid}-glow)`} />
      </g>
      <path
        d="M 4,58 Q 32,50 60,58"
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
