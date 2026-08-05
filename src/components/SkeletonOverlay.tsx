import { useState } from "react";
import { motion } from "framer-motion";
import skeletonImg from "@/assets/skeleton-render.png";
import { ZONE_LABELS, type BoneZone } from "@/data/englishFormula";

type Spot = {
  zone: BoneZone;
  style: React.CSSProperties;
  shape: "ring" | "bar" | "frame" | "anchor";
};

const SPOTS: Spot[] = [
  // Big region first so the narrower ones sit on top of it.
  { zone: "limbs", shape: "frame", style: { top: "25%", height: "50%", width: "70%" } },
  { zone: "spine", shape: "bar", style: { top: "25%", height: "35%", width: "10%" } },
  { zone: "skull", shape: "ring", style: { top: "5%", height: "18%", width: "30%" } },
  { zone: "feet", shape: "anchor", style: { bottom: "2%", height: "10%", width: "30%" } },
];

const YELLOW = "#FDE047";
const PURPLE = "#A855F7";

function Highlight({ shape, on }: { shape: Spot["shape"]; on: boolean }) {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: on ? 1 : 0,
    transition: "opacity 300ms ease, box-shadow 300ms ease",
    pointerEvents: "none",
  };

  if (shape === "ring")
    return (
      <span
        style={{
          ...base,
          borderRadius: "50%",
          border: `2px solid ${YELLOW}`,
          boxShadow: `0 0 12px ${YELLOW}, inset 0 0 18px rgba(253,224,71,0.25)`,
        }}
      />
    );

  if (shape === "bar")
    return (
      <span
        style={{
          ...base,
          left: "50%",
          right: "auto",
          width: 6,
          transform: "translateX(-50%)",
          borderRadius: 999,
          background: `linear-gradient(180deg, transparent, ${YELLOW}, transparent)`,
          boxShadow: `0 0 16px ${YELLOW}`,
        }}
      />
    );

  if (shape === "anchor")
    return (
      <span
        className={on ? "ef-pulse" : undefined}
        style={{
          ...base,
          borderRadius: "50%",
          border: `2px solid ${YELLOW}`,
          boxShadow: `0 0 18px ${YELLOW}`,
        }}
      />
    );

  return (
    <span
      style={{
        ...base,
        borderRadius: 24,
        border: `2px solid ${PURPLE}`,
        boxShadow: `0 0 22px ${PURPLE}, inset 0 0 30px rgba(168,85,247,0.18)`,
      }}
    />
  );
}

export function SkeletonOverlay({
  active,
  onPick,
  className,
}: {
  active: BoneZone | null;
  onPick: (zone: BoneZone) => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState<BoneZone | null>(null);
  const lit = hovered ?? active;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}
    >
      <div className="relative w-full max-w-[300px]">
        <img
          src={skeletonImg}
          alt="3D anatomical skeleton used as the essay blueprint"
          loading="lazy"
          width={768}
          height={1536}
          draggable={false}
          className="pointer-events-none w-full select-none"
          style={{
            filter: "drop-shadow(0 0 15px rgba(168, 85, 247, 0.3)) saturate(0.9) brightness(0.95)",
          }}
        />

        {SPOTS.map((s) => {
          const on = lit === s.zone;
          const selected = active === s.zone;
          return (
            <button
              key={s.zone}
              type="button"
              aria-label={ZONE_LABELS[s.zone]}
              aria-pressed={selected}
              onMouseEnter={() => setHovered(s.zone)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.zone)}
              onBlur={() => setHovered(null)}
              onClick={() => onPick(s.zone)}
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                ...s.style,
              }}
            >
              <Highlight shape={s.shape} on={on || selected} />
            </button>
          );
        })}

        {/* Floating HUD badge */}
        {lit && (
          <motion.div
            key={lit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur-md"
            style={{
              borderColor: active === lit ? YELLOW : "color-mix(in oklab, var(--primary) 60%, transparent)",
              color: active === lit ? YELLOW : "var(--foreground)",
              background: "color-mix(in oklab, var(--background) 72%, transparent)",
              boxShadow:
                active === lit ? `0 0 14px rgba(253,224,71,0.35)` : `0 0 14px rgba(168,85,247,0.3)`,
            }}
          >
            {ZONE_LABELS[lit]}
          </motion.div>
        )}
      </div>
    </div>
  );
}
