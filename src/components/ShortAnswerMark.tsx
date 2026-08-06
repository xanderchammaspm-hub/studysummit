type Props = {
  size?: number;
  className?: string;
};

/**
 * Short Answer emblem — dark glass capsule, three glass text lines and a
 * high-tech analytical lens highlighting one snippet in electric yellow.
 */
export function ShortAnswerMark({ size = 220, className }: Props) {
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      role="img"
      aria-label="Short Answer"
      className={`sa-mark cursor-pointer select-none ${className ?? ""}`}
    >
      <defs>
        <linearGradient id="saGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1B1633" />
          <stop offset="55%" stopColor="#0D0B18" />
          <stop offset="100%" stopColor="#150F2B" />
        </linearGradient>
        <linearGradient id="saRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#A855F7" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FDE047" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="saInner" cx="50%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="saLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.14" />
        </linearGradient>
        <radialGradient id="saLensFill" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#A855F7" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#0D0B18" stopOpacity="0.25" />
        </radialGradient>
        <filter id="saGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="saSoft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id="saLensClip">
          <circle cx="132" cy="108" r="44" />
        </clipPath>
      </defs>

      {/* Glass capsule */}
      <rect x="16" y="16" width="208" height="208" rx="56" fill="url(#saGlass)" />
      <rect x="16" y="16" width="208" height="208" rx="56" fill="url(#saInner)" />
      <rect
        x="16.75"
        y="16.75"
        width="206.5"
        height="206.5"
        rx="55"
        fill="none"
        stroke="url(#saRim)"
        strokeWidth="1.5"
      />

      {/* Glass text lines */}
      <g>
        <rect x="52" y="80" width="136" height="9" rx="4.5" fill="url(#saLine)" />
        <rect x="52" y="106" width="152" height="9" rx="4.5" fill="url(#saLine)" />
        <rect x="52" y="132" width="112" height="9" rx="4.5" fill="url(#saLine)" />
      </g>

      {/* Highlighted snippet under the lens */}
      <g clipPath="url(#saLensClip)">
        <rect
          className="sa-mark-hl-glow"
          x="104"
          y="102"
          width="62"
          height="17"
          rx="8"
          fill="#FDE047"
          opacity="0.35"
          filter="url(#saSoft)"
        />
        <rect
          className="sa-mark-hl"
          x="106"
          y="106"
          width="58"
          height="9"
          rx="4.5"
          fill="#FDE047"
        />
      </g>

      {/* Purple bracket framing the snippet */}
      <g stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#saGlow)">
        <path d="M103 97v-4.5h9" />
        <path d="M103 124v4.5h9" />
        <path d="M167 97v-4.5h-9" />
        <path d="M167 124v4.5h-9" />
      </g>

      {/* Lens */}
      <g className="sa-mark-lens">
        <line
          x1="163"
          y1="139"
          x2="192"
          y2="168"
          stroke="#A855F7"
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.85"
        />
        <line
          x1="165"
          y1="141"
          x2="189"
          y2="165"
          stroke="#FDE047"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="132" cy="108" r="44" fill="url(#saLensFill)" />
        <circle
          cx="132"
          cy="108"
          r="44"
          fill="none"
          stroke="#A855F7"
          strokeWidth="4"
          filter="url(#saGlow)"
        />
        <circle cx="132" cy="108" r="37" fill="none" stroke="#C4B5FD" strokeWidth="0.75" opacity="0.5" />
        {/* reticle ticks */}
        <g stroke="#FDE047" strokeWidth="2" strokeLinecap="round" opacity="0.9">
          <path d="M132 64v9" />
          <path d="M132 143v9" />
          <path d="M88 108h9" />
          <path d="M167 108h9" />
        </g>
        <path
          d="M104 88a44 44 0 0 1 22-19"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
