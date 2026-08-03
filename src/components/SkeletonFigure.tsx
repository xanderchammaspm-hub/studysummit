import { motion } from "framer-motion";
import {
  SKELETON_PATH,
  SKELETON_TRANSFORM,
  SKELETON_VIEWBOX as VB,
} from "@/assets/skeletonPath";

export type Zone = { id: string; rects: [number, number, number, number][] };

/** Hot zones mapped over the anatomical vector (coords in the 492 x 1426 space). */
export const ZONES: Zone[] = [
  { id: "skull", rects: [[168, 0, 155, 196]] },
  { id: "spine", rects: [[140, 196, 210, 306]] },
  { id: "vertebrae", rects: [[126, 502, 240, 268]] },
  {
    id: "limbs",
    rects: [
      [16, 228, 136, 684],
      [338, 228, 140, 684],
      [108, 770, 284, 492],
    ],
  },
  { id: "feet", rects: [[36, 1248, 420, 178]] },
];

export function zoneBBox(id: string | null) {
  const zone = ZONES.find((z) => z.id === id);
  if (!zone) return null;
  const x0 = Math.min(...zone.rects.map((r) => r[0]));
  const y0 = Math.min(...zone.rects.map((r) => r[1]));
  const x1 = Math.max(...zone.rects.map((r) => r[0] + r[2]));
  const y1 = Math.max(...zone.rects.map((r) => r[1] + r[3]));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const PAD = 34;

export function zoneTransform(id: string | null) {
  const box = zoneBBox(id);
  if (!box) return { x: 0, y: 0, scale: 1 };
  const scale = Math.min(
    VB.w / (box.w + PAD * 2),
    VB.h / (box.h + PAD * 2),
    4.2,
  );
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return {
    x: VB.w / 2 - cx * scale,
    y: VB.h / 2 - cy * scale,
    scale,
  };
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
      aria-label="Interactive anatomical essay skeleton"
    >
      <defs>

        {ZONES.map((z) => (
          <clipPath key={z.id} id={`ef-clip-${z.id}`}>
            {z.rects.map((r, i) => (
              <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} />
            ))}
          </clipPath>
        ))}
      </defs>

      <motion.g
        style={{ originX: 0, originY: 0 }}
        animate={{ x: t.x, y: t.y, scale: t.scale }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Base figure */}
        <g transform={SKELETON_TRANSFORM}>
          <path
            d={SKELETON_PATH}
            fill="color-mix(in oklab, var(--primary) 62%, oklch(0.9 0.02 285))"
            stroke="var(--primary)"
            strokeWidth={1.5}
            style={{
              opacity: lit ? 0.4 : 0.82,
              transition: "opacity 450ms ease",
            }}
          />
        </g>

        {/* Lit region, clipped from the same vector */}
        {lit && (
          <g
            style={{
              filter:
                "drop-shadow(0 0 5px var(--primary)) drop-shadow(0 0 14px var(--primary))",
            }}
          >

            <g clipPath={`url(#ef-clip-${lit})`}>
              <g transform={SKELETON_TRANSFORM}>
                <path
                  d={SKELETON_PATH}
                  fill="oklch(0.97 0.02 290)"
                  stroke="var(--primary)"
                  strokeWidth={1.5}
                />
              </g>
            </g>
          </g>
        )}


        {/* Click targets */}
        {ZONES.map((z) => (
          <g
            key={z.id}
            onClick={() => onPick(active === z.id ? null : z.id)}
            onMouseEnter={() => onHover(z.id)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer" }}
          >
            {z.rects.map((r, i) => (
              <rect
                key={i}
                x={r[0]}
                y={r[1]}
                width={r[2]}
                height={r[3]}
                fill="transparent"
              />
            ))}
          </g>
        ))}
      </motion.g>
    </svg>
  );
}
