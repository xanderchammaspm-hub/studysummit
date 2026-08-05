import { motion } from "framer-motion";
import skeletonHologram from "@/assets/skeleton-holo-v2.png";
import { FRONTAL_VIEWBOX as VB, ZONE_BOXES, type BoneZone } from "@/assets/skeletonFrontal";

export const ZONE_IDS: BoneZone[] = ["skull", "spine", "vertebrae", "limbs", "feet"];

type Rect = [number, number, number, number];

/**
 * Pointer hit areas, calibrated against the rendered hologram
 * (image is drawn with preserveAspectRatio="xMidYMid meet" into the 400x1080 box).
 */
const HIT_RECTS: Record<BoneZone, Rect[]> = {
  skull: [[148, 72, 104, 124]],
  spine: [[126, 196, 148, 202]],
  vertebrae: [[130, 398, 140, 174]],
  limbs: [
    [34, 240, 92, 530],
    [274, 240, 92, 530],
    [130, 578, 140, 316],
  ],
  feet: [[96, 894, 208, 106]],
};

/** Regions of the hologram lit up for each zone (same geometry as the hit areas). */
const GLOW_RECTS: Record<BoneZone, Rect[]> = {
  skull: [[142, 66, 116, 136]],
  spine: [[96, 188, 208, 218]],
  vertebrae: [[110, 392, 180, 188]],
  limbs: [
    [30, 232, 100, 546],
    [270, 232, 100, 546],
    [124, 572, 152, 326],
  ],
  feet: [[92, 886, 216, 116]],
};

const PAD = 40;

export function zoneTransform(id: string | null) {
  const box = ZONE_BOXES[id as BoneZone];
  if (!box) return { x: 0, y: 0, scale: 1 };
  const scale = Math.min(VB.w / (box.w + PAD * 2), VB.h / (box.h + PAD * 2), 3.2);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return { x: VB.w / 2 - cx * scale, y: VB.h / 2 - cy * scale, scale };
}

/** Iron-Man style ambient interface behind the figure. Purely decorative. */
function HudField() {
  const ticks = Array.from({ length: 48 }, (_, i) => i);
  return (
    <g aria-hidden pointerEvents="none">
      <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#skel-aura)" />
      <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#hud-grid)" opacity="0.5" />

      {/* Concentric scan rings */}
      <g stroke="var(--primary)" fill="none" opacity="0.28">
        <circle cx={VB.w / 2} cy={VB.h / 2} r="150" strokeWidth="0.6" strokeDasharray="3 9" />
        <circle cx={VB.w / 2} cy={VB.h / 2} r="196" strokeWidth="0.5" strokeDasharray="18 12" />
      </g>

      {/* Slow rotating reticle */}
      <g
        style={{ transformOrigin: `${VB.w / 2}px ${VB.h / 2}px`, animation: "hudSpin 48s linear infinite" }}
        opacity="0.4"
      >
        <circle
          cx={VB.w / 2}
          cy={VB.h / 2}
          r="172"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="0.7"
          strokeDasharray="60 26 12 26"
        />
        {ticks.map((i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const r1 = 172;
          const r2 = i % 6 === 0 ? 182 : 177;
          return (
            <line
              key={i}
              x1={VB.w / 2 + Math.cos(a) * r1}
              y1={VB.h / 2 + Math.sin(a) * r1}
              x2={VB.w / 2 + Math.cos(a) * r2}
              y2={VB.h / 2 + Math.sin(a) * r2}
              stroke={i % 6 === 0 ? "var(--yellow)" : "var(--primary)"}
              strokeWidth="0.7"
            />
          );
        })}
      </g>

      {/* Counter-rotating inner arc */}
      <g
        style={{ transformOrigin: `${VB.w / 2}px ${VB.h / 2}px`, animation: "hudSpinRev 30s linear infinite" }}
        opacity="0.35"
      >
        <circle
          cx={VB.w / 2}
          cy={VB.h / 2}
          r="118"
          fill="none"
          stroke="var(--yellow)"
          strokeWidth="0.6"
          strokeDasharray="40 200"
        />
      </g>

      {/* Corner brackets */}
      <g stroke="var(--primary)" strokeWidth="1.1" fill="none" opacity="0.55">
        <path d="M 14,44 v -30 h 30" />
        <path d="M 386,44 v -30 h -30" />
        <path d="M 14,1036 v 30 h 30" />
        <path d="M 386,1036 v 30 h -30" />
      </g>
      <g fill="var(--yellow)" opacity="0.7">
        <circle cx="14" cy="14" r="2" />
        <circle cx="386" cy="14" r="2" />
        <circle cx="14" cy="1066" r="2" />
        <circle cx="386" cy="1066" r="2" />
      </g>

      {/* Edge data ticks */}
      <g stroke="var(--primary)" strokeWidth="0.8" opacity="0.35">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1="8" y1={120 + i * 38} x2={i % 4 === 0 ? 28 : 18} y2={120 + i * 38} />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`r${i}`} x1="392" y1={120 + i * 38} x2={i % 4 === 0 ? 372 : 382} y2={120 + i * 38} />
        ))}
      </g>
    </g>
  );
}

export function SkeletonFigure({
  active,
  hovered,
  onPick,
  onHover,
  className,
}: {
  active: string | null;
  hovered: string | null;
  onPick: (id: string | null) => void;
  onHover: (id: string | null) => void;
  className?: string;
}) {
  const t = zoneTransform(active);
  const lit = (active ?? hovered) as BoneZone | null;
  const glow = lit ? (GLOW_RECTS[lit] ?? []) : [];

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={className}
      role="img"
      aria-label="Interactive holographic anatomical essay skeleton, frontal view"
    >
      <defs>
        <radialGradient id="skel-aura" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0%" stopColor="oklch(0.5 0.2 300 / 0.32)" />
          <stop offset="100%" stopColor="oklch(0.2 0.06 290 / 0)" />
        </radialGradient>
        <pattern id="hud-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.4"
            opacity="0.18"
          />
        </pattern>
        <linearGradient id="hud-sweep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.9 0.14 82 / 0)" />
          <stop offset="50%" stopColor="oklch(0.85 0.16 300 / 0.35)" />
          <stop offset="100%" stopColor="oklch(0.9 0.14 82 / 0)" />
        </linearGradient>
        <clipPath id="zone-clip">
          {glow.map((r, i) => (
            <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx="12" />
          ))}
        </clipPath>
        <filter id="zone-lift" x="-30%" y="-30%" width="160%" height="160%">
          <feColorMatrix
            type="matrix"
            values="1.6 0 0 0 0.05
                    0   1.1 0 0 0
                    0   0  1.9 0 0.12
                    0   0   0  1 0"
          />
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <HudField />

      <motion.g
        style={{ originX: 0, originY: 0 }}
        animate={{ x: t.x, y: t.y, scale: t.scale }}
        transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.9 }}
      >
        {/* Base hologram */}
        <g
          style={{
            opacity: lit ? 0.42 : 0.95,
            transition: "opacity 400ms ease",
            filter: "drop-shadow(0 0 16px oklch(0.6 0.2 300 / 0.55))",
          }}
        >
          <image
            href={skeletonHologram}
            x="0"
            y="0"
            width={VB.w}
            height={VB.h}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* Highlighted region — same pixels, brightened, so it can never misalign */}
        {lit && (
          <g clipPath="url(#zone-clip)" style={{ filter: "url(#zone-lift)" }}>
            <image
              href={skeletonHologram}
              x="0"
              y="0"
              width={VB.w}
              height={VB.h}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        )}

        {/* Region frame */}
        {lit &&
          glow.map((r, i) => (
            <rect
              key={`f${i}`}
              x={r[0]}
              y={r[1]}
              width={r[2]}
              height={r[3]}
              rx="12"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1"
              strokeDasharray="14 8"
              opacity="0.75"
              pointerEvents="none"
              style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
            />
          ))}

        {/* Scan sweep */}
        <rect
          x="0"
          y="0"
          width={VB.w}
          height="140"
          fill="url(#hud-sweep)"
          opacity="0.5"
          pointerEvents="none"
          aria-hidden
          style={{ animation: "hudScan 7s ease-in-out infinite" }}
        />

        {/* Click targets */}
        {ZONE_IDS.map((z) =>
          HIT_RECTS[z].map((r, i) => (
            <rect
              key={`${z}-${i}`}
              x={r[0]}
              y={r[1]}
              width={r[2]}
              height={r[3]}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={() => onPick(active === z ? null : z)}
              onMouseEnter={() => onHover(z)}
              onMouseLeave={() => onHover(null)}
            />
          )),
        )}
      </motion.g>
    </svg>
  );
}
