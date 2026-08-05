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

/** Very faint radial bloom directly behind the figure. Purely decorative. */
function AmbientGlow() {
  return (
    <g aria-hidden pointerEvents="none">
      <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#skel-aura)" />
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
        <radialGradient id="skel-aura" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0%" stopColor="oklch(0.5 0.2 300 / 0.10)" />
          <stop offset="100%" stopColor="oklch(0.2 0.06 290 / 0)" />
        </radialGradient>

        {/* Drops the image's near-black plate so the figure floats on the page */}
        <filter id="holo-key" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    1.1 1.1 1.1 0 -0.12"
          />
          <feColorMatrix type="saturate" values="0.82" />
        </filter>

        {/* Soft-edged reveal for the hovered region — no visible boundary */}
        <mask id="zone-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={VB.w} height={VB.h}>
          <g filter="url(#zone-feather)">
            {glow.map((r, i) => (
              <rect
                key={i}
                x={r[0]}
                y={r[1]}
                width={r[2]}
                height={r[3]}
                rx="24"
                fill="white"
              />
            ))}
          </g>
        </mask>
        <filter id="zone-feather" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="26" />
        </filter>

        <filter id="zone-lift" x="-30%" y="-30%" width="160%" height="160%">
          <feColorMatrix
            type="matrix"
            values="1.25 0 0 0 0
                    0   0.95 0 0 0
                    0   0  1.45 0 0.04
                    1.1 1.1 1.1 0 -0.12"
          />
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <AmbientGlow />

      <motion.g
        style={{ originX: 0, originY: 0 }}
        animate={{ x: t.x, y: t.y, scale: t.scale }}
        transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.9 }}
      >
        {/* Base hologram */}
        <g
          style={{
            opacity: lit ? 0.5 : 0.68,
            transition: "opacity 400ms ease",
            filter: "url(#holo-key) drop-shadow(0 0 10px oklch(0.6 0.2 300 / 0.28))",
            mixBlendMode: "screen",
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
          <g
            mask="url(#zone-mask)"
            style={{ filter: "url(#zone-lift)", mixBlendMode: "screen", opacity: 0.95 }}
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
        )}


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
