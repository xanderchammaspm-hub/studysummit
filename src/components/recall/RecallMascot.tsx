import { useCallback, useRef, useState } from "react";
import summiAsset from "@/assets/summi-mascot-transparent.png.asset.json";
import summiJoy from "@/assets/summi-joy-jump.png";

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

type Burst = { id: number; spins: number; stars: { a: number; d: number; s: number; gold: boolean }[] };

/**
 * Summi — the glowing galaxy blob buddy. The artwork stays on-brand while the
 * mood drives its pose: floating, tilting in thought, squashing on a bounce or
 * shaking off a wobble, plus orbiting sparks and a soft ground shadow.
 *
 * Clicking him sends him into a low-gravity Kirby-style spin and sprays a
 * short burst of star sparkles. Rapid clicks stack into a longer spin.
 */
export function RecallMascot({
  mood = "idle",
  size = 72,
  className = "",
  label,
  interactive = true,
  still = false,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Optional speech bubble caption under/next to Summi. */
  label?: string;
  /** Set false to disable the click-to-spin easter egg. */
  interactive?: boolean;
  /** Stationary logo mode: no float, no sparks, no click interaction. */
  still?: boolean;
}) {
  const canInteract = interactive && !still;
  const glow = GLOW[mood];
  const sparks = still
    ? 0
    : mood === "celebrate" || mood === "happy"
      ? 5
      : mood === "thinking"
        ? 3
        : 0;

  const [burst, setBurst] = useState<Burst | null>(null);
  const seq = useRef(0);
  const timer = useRef<number | null>(null);

  const poke = useCallback(() => {
    if (!interactive) return;
    seq.current += 1;
    const id = seq.current;
  const spins = burst ? Math.min(3, burst.spins + 1) : 1;
    const count = 7 + spins * 2;
    setBurst({
      id,
      spins,
      stars: Array.from({ length: count }, (_, i) => ({
        a: (360 / count) * i + (i % 2 ? 12 : -9),
        d: size * (0.55 + ((i * 7) % 5) * 0.11),
        s: 3 + ((i * 5) % 4),
        gold: i % 3 === 0,
      })),
    });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBurst(null), 900 * spins + 240);
  }, [burst, interactive, size]);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div
        className={`relative ${interactive ? "cursor-pointer select-none" : ""}`}
        style={{ width: size, height: size * 1.16 }}
        onClick={poke}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? "Poke Summi" : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            poke();
          }
        }}
      >
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

        {/* click flare */}
        {burst ? (
          <span
            key={`flare-${burst.id}`}
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 60%, white) 0%, transparent 65%)",
              animation: "mascotFlare 620ms ease-out forwards",
            }}
          />
        ) : null}

        {/* A click swaps to a real expressive pose instead of rotating a flat
            picture. Nested layers keep anticipation, moon-hop and landing soft. */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: size,
            animation: burst ? undefined : MOTION[mood],
          }}
          key={burst ? `spin-${burst.id}` : `pose-${mood}`}
        >
          <div
            className="h-full w-full"
            style={{
              animation: burst
                ? `mascotJoyHop ${0.62 * burst.spins + 0.48}s cubic-bezier(0.22,0.86,0.28,1) both`
                : undefined,
            }}
          >
            <div
              className="h-full w-full will-change-transform"
              style={{
                animation: burst
                  ? `mascotJoyTurn ${0.62 * burst.spins + 0.48}s cubic-bezier(0.2,0.75,0.25,1) both`
                  : undefined,
              }}
            >
              <div
                className="relative h-full w-full"
                style={{
                  animation: burst
                    ? `mascotJoySquash ${0.62 * burst.spins + 0.48}s ease-in-out both`
                    : "mascotBreathe 3.2s ease-in-out infinite",
                }}
              >
                {/* (the artwork already has his arms — no extra nubs) */}

                <img
                  src={burst ? summiJoy : summiAsset.url}
                  alt=""
                  width={size}
                  height={size}
                  loading="lazy"
                  className="h-full w-full select-none object-contain"
                  style={{
                    filter: `saturate(${1 + glow * 0.3}) drop-shadow(0 6px 18px oklch(0.6 0.2 300 / 0.45))`,
                    transform: burst ? "scale(1.18)" : undefined,
                  }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* click star burst */}
        {burst
          ? burst.stars.map((st, i) => {
              const rad = (st.a * Math.PI) / 180;
              return (
                <span
                  key={`${burst.id}-${i}`}
                  className="pointer-events-none absolute left-1/2 top-1/2"
                  style={{
                    width: st.s,
                    height: st.s,
                    marginLeft: -st.s / 2,
                    marginTop: -st.s / 2,
                    borderRadius: 1,
                    background: st.gold
                      ? "var(--yellow, oklch(0.9 0.14 82))"
                      : "color-mix(in oklab, var(--primary) 70%, white)",
                    boxShadow: `0 0 ${st.s * 2.5}px currentColor`,
                    color: st.gold ? "oklch(0.9 0.14 82)" : "oklch(0.75 0.2 300)",
                    ["--sx" as string]: `${Math.cos(rad) * st.d}px`,
                    ["--sy" as string]: `${Math.sin(rad) * st.d}px`,
                    animation: `mascotStarPop ${700 + i * 26}ms cubic-bezier(0.18,0.9,0.3,1) forwards`,
                  }}
                />
              );
            })
          : null}

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
