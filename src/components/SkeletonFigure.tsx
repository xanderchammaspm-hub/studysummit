import { motion } from "framer-motion";
import skeletonHologram from "@/assets/skeleton-hologram.png";
import {
  CENTER_BONES,
  FRONTAL_VIEWBOX as VB,
  MIRROR_TRANSFORM,
  SIDE_BONES,
  ZONE_BOXES,
  type Bone,
  type BoneZone,
} from "@/assets/skeletonFrontal";

export const ZONE_IDS: BoneZone[] = ["skull", "spine", "vertebrae", "limbs", "feet"];

/** Pointer hit areas (kept disjoint so overlapping zoom boxes don't steal clicks). */
const HIT_RECTS: Record<BoneZone, [number, number, number, number][]> = {
  skull: [[132, 8, 136, 180]],
  spine: [[148, 188, 104, 300]],
  vertebrae: [[100, 488, 200, 250]],
  limbs: [
    [40, 240, 108, 470],
    [252, 240, 108, 470],
    [104, 740, 192, 258],
  ],
  feet: [[110, 998, 180, 78]],
};

const PAD = 40;

export function zoneTransform(id: string | null) {
  const box = ZONE_BOXES[id as BoneZone];
  if (!box) return { x: 0, y: 0, scale: 1 };
  const scale = Math.min(VB.w / (box.w + PAD * 2), VB.h / (box.h + PAD * 2), 3.6);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return { x: VB.w / 2 - cx * scale, y: VB.h / 2 - cy * scale, scale };
}

const LINE = "oklch(0.95 0.04 300)";

/** Neon overlay bones — only the highlighted zone is drawn on top of the hologram. */
function ZoneGlow({ bones, lit }: { bones: Bone[]; lit: string | null }) {
  if (!lit) return null;
  return (
    <>
      {bones
        .filter((b) => b.zone === lit)
        .map((b, i) => (
          <path
            key={i}
            d={b.d}
            fill="color-mix(in oklab, var(--primary) 22%, transparent)"
            stroke={LINE}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{
              filter:
                "drop-shadow(0 0 6px var(--primary)) drop-shadow(0 0 18px var(--primary))",
              transition: "opacity 400ms ease",
            }}
          />
        ))}
    </>
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
  const lit = active ?? hovered;

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={className}
      role="img"
      aria-label="Interactive holographic anatomical essay skeleton, frontal view"
    >
      <defs>
        <clipPath id="skel-half">
          <rect x={VB.w / 2} y="0" width={VB.w / 2} height={VB.h} />
        </clipPath>
        <radialGradient id="skel-aura" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0%" stopColor="oklch(0.5 0.2 300 / 0.35)" />
          <stop offset="100%" stopColor="oklch(0.2 0.06 290 / 0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#skel-aura)" />

      <motion.g
        style={{ originX: 0, originY: 0 }}
        animate={{ x: t.x, y: t.y, scale: t.scale }}
        transition={{ type: "spring", stiffness: 130, damping: 20, mass: 0.9 }}
      >
        {/* Hologram render: one half of the source image, mirrored for perfect symmetry */}
        <g
          style={{
            opacity: lit ? 0.55 : 0.95,
            transition: "opacity 400ms ease",
            filter: "drop-shadow(0 0 14px oklch(0.6 0.2 300 / 0.55))",
          }}
        >
          <image
            href={skeletonHologram}
            x="0"
            y="0"
            width={VB.w}
            height={VB.h}
            preserveAspectRatio="xMidYMid meet"
            clipPath="url(#skel-half)"
          />
          <g transform={MIRROR_TRANSFORM}>
            <image
              href={skeletonHologram}
              x="0"
              y="0"
              width={VB.w}
              height={VB.h}
              preserveAspectRatio="xMidYMid meet"
              clipPath="url(#skel-half)"
            />
          </g>
        </g>

        {/* Highlighted region */}
        <ZoneGlow bones={CENTER_BONES} lit={lit} />
        <ZoneGlow bones={SIDE_BONES} lit={lit} />
        <g transform={MIRROR_TRANSFORM}>
          <ZoneGlow bones={SIDE_BONES} lit={lit} />
        </g>

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
