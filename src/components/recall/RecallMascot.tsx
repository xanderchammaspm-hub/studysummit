export type MascotMood = "idle" | "thinking" | "happy" | "celebrate" | "encourage";

/**
 * Summi — a round, friendly blob buddy with little arms and feet, drawn in the
 * Summit purple → violet → gold gradient. Reacts to how the student is doing.
 */
export function RecallMascot({
  mood = "idle",
  size = 72,
  className = "",
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const happy = mood === "happy" || mood === "celebrate";
  const thinking = mood === "thinking";
  const wink = mood === "encourage";
  const uid = `summi-${size}-${mood}`;

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: size,
        height: size,
        animation:
          mood === "celebrate"
            ? "mascotBounce 900ms cubic-bezier(0.22,1,0.36,1) infinite"
            : "mascotFloat 4s ease-in-out infinite",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <radialGradient id={`${uid}-body`} cx="0.36" cy="0.28" r="0.85">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="42%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>
          <linearGradient id={`${uid}-limb`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#5b21b6" />
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#fdf7e3" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fdf7e3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* celebration sparks */}
        {mood === "celebrate" && (
          <g fill="#fde047">
            <path d="M16 26 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 Z" opacity="0.9" />
            <path d="M102 20 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8 Z" opacity="0.8" />
            <circle cx="108" cy="52" r="2.2" opacity="0.7" />
            <circle cx="12" cy="58" r="1.8" opacity="0.7" />
          </g>
        )}

        {/* soft ground shadow */}
        <ellipse cx="60" cy="103" rx="30" ry="5" fill="#2e1065" opacity="0.45" />

        {/* feet */}
        <ellipse cx="45" cy="97" rx="12" ry="7" fill={`url(#${uid}-limb)`} />
        <ellipse cx="75" cy="97" rx="12" ry="7" fill={`url(#${uid}-limb)`} />

        {/* arms */}
        <ellipse cx="21" cy="72" rx="9" ry="12" transform="rotate(-18 21 72)" fill={`url(#${uid}-limb)`} />
        <ellipse cx="99" cy="72" rx="9" ry="12" transform="rotate(18 99 72)" fill={`url(#${uid}-limb)`} />

        {/* rounded blob body — tall dome, flat base */}
        <path
          d="M60 16 C86 16 100 38 100 62 C100 84 84 96 60 96 C36 96 20 84 20 62 C20 38 34 16 60 16 Z"
          fill={`url(#${uid}-body)`}
          stroke="#c084fc"
          strokeOpacity="0.55"
          strokeWidth="1.6"
        />
        {/* gloss */}
        <path
          d="M60 20 C78 20 92 36 94 54 C82 40 70 34 52 33 C40 32 32 38 27 48 C31 31 43 20 60 20 Z"
          fill={`url(#${uid}-shine)`}
        />
        {/* gold rim light */}
        <path
          d="M92 74 C87 87 74 94 60 94"
          fill="none"
          stroke="#fde047"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* face */}
        <g>
          {happy ? (
            <>
              <path d="M43 58 q5 -7 10 0" fill="none" stroke="#1e1035" strokeWidth="4" strokeLinecap="round" />
              <path d="M67 58 q5 -7 10 0" fill="none" stroke="#1e1035" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx={thinking ? 49 : 48} cy={thinking ? 55 : 58} rx="4.2" ry="5" fill="#1e1035" />
              {wink ? (
                <path d="M67 58 q5 5 10 0" fill="none" stroke="#1e1035" strokeWidth="4" strokeLinecap="round" />
              ) : (
                <ellipse cx={thinking ? 73 : 72} cy={thinking ? 55 : 58} rx="4.2" ry="5" fill="#1e1035" />
              )}
            </>
          )}

          {/* mouth */}
          {happy ? (
            <path d="M50 71 q10 11 20 0" fill="#2e1065" stroke="#1e1035" strokeWidth="2" strokeLinejoin="round" />
          ) : mood === "encourage" ? (
            <path d="M52 72 q8 7 16 0" fill="none" stroke="#1e1035" strokeWidth="3.4" strokeLinecap="round" />
          ) : thinking ? (
            <ellipse cx="60" cy="74" rx="4" ry="3.4" fill="none" stroke="#1e1035" strokeWidth="3" />
          ) : (
            <path d="M53 71 q7 6 14 0" fill="none" stroke="#1e1035" strokeWidth="3.2" strokeLinecap="round" />
          )}

          {/* blush */}
          <ellipse cx="37" cy="68" rx="5" ry="3.4" fill="#f0abfc" opacity="0.4" />
          <ellipse cx="83" cy="68" rx="5" ry="3.4" fill="#f0abfc" opacity="0.4" />
        </g>

        {/* thinking bubbles */}
        {thinking && (
          <g fill="#fde047" opacity="0.85">
            <circle cx="96" cy="30" r="2.4" />
            <circle cx="103" cy="22" r="3.4" />
          </g>
        )}
      </svg>
    </div>
  );
}
