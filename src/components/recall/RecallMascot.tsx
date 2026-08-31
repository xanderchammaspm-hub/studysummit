import summiAsset from "@/assets/summi-mascot-transparent.png.asset.json";

export type MascotMood = "idle" | "thinking" | "happy" | "celebrate" | "encourage";

/**
 * Summi — the glowing galaxy blob buddy. Rendered from the artwork so it stays
 * exactly on-brand; the mood only drives motion and glow intensity.
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
  const glow =
    mood === "celebrate" || mood === "happy" ? 0.85 : mood === "thinking" ? 0.4 : 0.6;

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
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--primary) ${Math.round(
            glow * 100,
          )}%, transparent), transparent 70%)`,
        }}
      />
      <img
        src={summiAsset.url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="relative h-full w-full select-none object-contain"
        style={{ filter: `saturate(${1 + glow * 0.25})` }}
        draggable={false}
      />
    </div>
  );
}
