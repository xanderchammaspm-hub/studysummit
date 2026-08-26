export type MascotMood = "idle" | "thinking" | "happy" | "celebrate" | "encourage";

/**
 * Summi — Summit's original mountain buddy. A geometric peak with a snow cap,
 * drawn in the app's purple → gold palette. Reacts to how the student is doing.
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
  const eyesHappy = mood === "happy" || mood === "celebrate";
  const eyesThinking = mood === "thinking";
  const wink = mood === "encourage";

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
          <linearGradient id="summi-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="55%" stopColor="#5b21b6" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>
          <linearGradient id="summi-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdf7e3" />
            <stop offset="100%" stopColor="#e9d9ff" />
          </linearGradient>
        </defs>

        {/* celebration sparks */}
        {mood === "celebrate" && (
          <g fill="#fde047">
            <path d="M18 22 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4 Z" opacity="0.9" />
            <path d="M100 16 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8 Z" opacity="0.8" />
            <circle cx="106" cy="46" r="2.2" opacity="0.7" />
            <circle cx="12" cy="52" r="1.8" opacity="0.7" />
          </g>
        )}

        {/* body — rounded peak */}
        <path
          d="M60 16 C64 24 74 38 84 54 C94 70 102 84 104 94 C105 100 100 104 94 104 L26 104 C20 104 15 100 16 94 C18 84 26 70 36 54 C46 38 56 24 60 16 Z"
          fill="url(#summi-body)"
          stroke="#a855f7"
          strokeOpacity="0.55"
          strokeWidth="1.6"
        />
        {/* snow cap */}
        <path
          d="M60 16 C64 24 70 32 76 42 C72 46 68 44 64 48 C61 51 57 51 54 47 C50 43 47 45 44 41 C50 31 56 24 60 16 Z"
          fill="url(#summi-snow)"
          opacity="0.95"
        />
        {/* ridge highlight */}
        <path
          d="M60 16 C62 22 66 30 72 40"
          fill="none"
          stroke="#fde047"
          strokeOpacity="0.55"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* face */}
        <g>
          {eyesHappy ? (
            <>
              <path d="M44 74 q4 -5 8 0" fill="none" stroke="#fdf7e3" strokeWidth="3" strokeLinecap="round" />
              <path d="M68 74 q4 -5 8 0" fill="none" stroke="#fdf7e3" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={eyesThinking ? 49 : 48} cy={eyesThinking ? 70 : 73} r="3.6" fill="#fdf7e3" />
              {wink ? (
                <path d="M68 73 q4 3 8 0" fill="none" stroke="#fdf7e3" strokeWidth="3" strokeLinecap="round" />
              ) : (
                <circle cx={eyesThinking ? 73 : 72} cy={eyesThinking ? 70 : 73} r="3.6" fill="#fdf7e3" />
              )}
            </>
          )}
          {/* mouth */}
          {mood === "celebrate" || mood === "happy" ? (
            <path d="M52 84 q8 7 16 0" fill="none" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          ) : mood === "encourage" ? (
            <path d="M54 85 q6 4 12 0" fill="none" stroke="#fde047" strokeWidth="2.6" strokeLinecap="round" />
          ) : mood === "thinking" ? (
            <circle cx="60" cy="86" r="2.4" fill="none" stroke="#fde047" strokeWidth="2.2" />
          ) : (
            <path d="M55 85 q5 3 10 0" fill="none" stroke="#fde047" strokeWidth="2.4" strokeLinecap="round" />
          )}
          {/* blush */}
          <circle cx="42" cy="81" r="3" fill="#f0abfc" opacity="0.35" />
          <circle cx="78" cy="81" r="3" fill="#f0abfc" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}
