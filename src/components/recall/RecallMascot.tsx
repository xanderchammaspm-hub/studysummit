import summiAsset from "@/assets/summi-mascot-transparent.png.asset.json";

export type MascotMood = "idle" | "thinking" | "happy" | "celebrate" | "encourage";

const MOTION: Record<MascotMood, string> = {
  idle: "mascotFloat 4.6s ease-in-out infinite",
  thinking: "mascotThink 2.6s ease-in-out infinite",
  happy: "mascotHappy 1.6s cubic-bezier(0.22,1,0.36,1) infinite",
  celebrate: "mascotBounce 1s cubic-bezier(0.22,1,0.36,1) infinite",
  encourage: "mascotNudge 2.4s ease-in-out infinite",
};

const GLOW: Record<MascotMood, number> = {
  idle: 0.55,
  thinking: 0.4,
  happy: 0.8,
  celebrate: 0.95,
  encourage: 0.6,
};

/**
 * Summi — the glowing galaxy blob buddy. The artwork stays on-brand while the
 * mood drives its pose: floating, tilting in thought, squashing on a bounce or
 * shaking off a wobble, plus orbiting sparks and a soft ground shadow.
 */
export function RecallMascot({
  mood = "idle",
  size = 72,
  className = "",
  label,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Optional speech bubble caption under/next to Summi. */
  label?: string;
}) {
  const glow = GLOW[mood];
  const sparks = mood === "celebrate" || mood === "happy" ? 5 : mood === "thinking" ? 3 : 0;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size * 1.16 }} aria-hidden>
        {/* orbit ring while thinking */}
        {mood === "thinking" ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-primary/35"
            style={{ animation: "mascotOrbit 9s linear infinite" }}
          />
        ) : null}

        {/* aura */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--primary) ${Math.round(
              glow * 100,
            )}%, transparent), transparent 70%)`,
            animation: "mascotGlow 3.4s ease-in-out infinite",
          }}
        />

        {/* body */}
        <div className="absolute inset-x-0 top-0" style={{ height: size, animation: MOTION[mood] }}>
          <img
            src={summiAsset.url}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            className="h-full w-full select-none object-contain"
            style={{ filter: `saturate(${1 + glow * 0.3}) drop-shadow(0 6px 18px oklch(0.6 0.2 300 / 0.45))` }}
            draggable={false}
          />
        </div>

        {/* sparks */}
        {Array.from({ length: sparks }).map((_, i) => (
          <span
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${14 + i * 18}%`,
              top: "18%",
              width: 4,
              height: 4,
              background: i % 2 ? "var(--yellow, oklch(0.9 0.14 82))" : "color-mix(in oklab, var(--primary) 85%, white)",
              boxShadow: "0 0 8px currentColor",
              animation: `mascotSpark ${1.4 + i * 0.22}s ease-out ${i * 0.18}s infinite`,
            }}
          />
        ))}

        {/* ground shadow */}
        <div
          className="pointer-events-none absolute inset-x-[22%] bottom-0 h-1.5 rounded-full blur-[3px]"
          style={{
            background: "color-mix(in oklab, var(--primary) 60%, transparent)",
            animation: "mascotShadow 4.6s ease-in-out infinite",
          }}
        />
      </div>

      {label ? (
        <div className="mt-1 rounded-full purple-outline bg-card/70 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-xl">
          {label}
        </div>
      ) : null}
    </div>
  );
}
