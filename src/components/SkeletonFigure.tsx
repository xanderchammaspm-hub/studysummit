import { motion } from "framer-motion";
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

const LINE = "oklch(0.93 0.035 295)";

function Bones({ bones, lit }: { bones: Bone[]; lit: string | null }) {
  return (
    <>
      {bones.map((b, i) => {
        const on = lit === b.zone;
        return (
          <path
            key={i}
            d={b.d}
            fill={on ? "color-mix(in oklab, var(--primary) 26%, transparent)" : "none"}
            stroke={on ? LINE : "color-mix(in oklab, var(--primary) 55%, white 20%)"}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{
              opacity: lit ? (on ? 1 : 0.28) : 0.72,
              filter: on ? "drop-shadow(0 0 6px var(--primary)) drop-shadow(0 0 16px var(--primary))" : undefined,
              transition: "opacity 400ms ease, stroke 400ms ease",
            }}
          />
        );
      })}
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
      aria-label="Interactive anatomical essay skeleton, frontal view"
    >
      <motion.g
        style={{ originX: 0, originY: 0 }}
        animate={{ x: t.x, y: t.y, scale: t.scale }}
        transition={{ type: "spring", stiffness: 130, damping: 18, mass: 0.9 }}
      >
        <Bones bones={CENTER_BONES} lit={lit} />
        <g>
          <Bones bones={SIDE_BONES} lit={lit} />
        </g>
        <g transform={MIRROR_TRANSFORM}>
          <Bones bones={SIDE_BONES} lit={lit} />
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
