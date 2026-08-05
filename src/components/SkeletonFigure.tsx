import { motion } from "framer-motion";
import skeletonHologram from "@/assets/skeleton-holo-v3.png.asset.json";
import { FRONTAL_VIEWBOX as VB, ZONE_BOXES, type BoneZone } from "@/assets/skeletonFrontal";

export const ZONE_IDS: BoneZone[] = ["skull", "spine", "vertebrae", "limbs", "feet"];

type Rect = [number, number, number, number];

/**
 * Pointer hit areas, calibrated against the rendered hologram
 * (image is drawn with preserveAspectRatio="xMidYMid meet" into the 400x1080 box).
 */
const HIT_RECTS: Record<BoneZone, Rect[]> = {
  skull: [[154, 36, 92, 122]],
  spine: [[130, 162, 140, 216]],
  vertebrae: [[132, 380, 136, 150]],
  limbs: [
    [44, 202, 84, 386],
    [272, 202, 84, 386],
    [124, 534, 152, 372],
  ],
  feet: [[128, 908, 144, 116]],
};

/** Regions of the hologram lit up for each zone (same geometry as the hit areas). */
const GLOW_RECTS: Record<BoneZone, Rect[]> = {
  skull: [[152, 34, 96, 126]],
  spine: [[116, 160, 168, 246]],
  vertebrae: [[126, 380, 148, 152]],
  limbs: [
    [42, 200, 92, 392],
    [266, 200, 92, 392],
    [120, 530, 160, 380],
  ],
  feet: [[128, 906, 144, 120]],
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
          <stop offset="0%" stopColor="oklch(0.5 0.2 300 / 0.06)" />
          <stop offset="100%" stopColor="oklch(0.2 0.06 290 / 0)" />
        </radialGradient>

        {/* Drops the image's near-black plate so the figure floats on the page */}
        <filter id="holo-key" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    1.1 1.1 1.1 0 -0.14"
          />
          <feColorMatrix type="saturate" values="0.7" />
        </filter>

        {/* Soft-edged reveal for the hovered region — long feather, no boundary */}
        <mask id="zone-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={VB.w} height={VB.h}>
          <g filter="url(#zone-feather)">
            {glow.map((r, i) => (
              <rect
                key={i}
                x={r[0]}
                y={r[1]}
                width={r[2]}
                height={r[3]}
                rx="40"
                fill="white"
              />
            ))}
          </g>
        </mask>
        <filter id="zone-feather" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="46" />
        </filter>

        {/* Purple illumination for the hovered bones + soft outer bloom */}
        <filter id="zone-lift" x="-40%" y="-40%" width="180%" height="180%">
          <feColorMatrix
            type="matrix"
            values="0.85 0 0 0 0.10
                    0   0.45 0 0 0
                    0   0  1.15 0 0.20
                    1.0 1.0 1.0 0 -0.14"
          />
          <feGaussianBlur stdDeviation="7" result="bloom" />
          <feMerge>
            <feMergeNode in="bloom" />
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
            opacity: 0.46,
            transition: "opacity 400ms ease",
            filter: "url(#holo-key) drop-shadow(0 0 6px oklch(0.6 0.2 300 / 0.16))",
            mixBlendMode: "screen",
          }}
        >
          <image
            href={skeletonHologram.url}
            x="0"
            y="0"
            width={VB.w}
            height={VB.h}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* Highlighted region — same pixels, purple-lit, so it can never misalign */}
        {lit && (
          <g
            mask="url(#zone-mask)"
            style={{ filter: "url(#zone-lift)", mixBlendMode: "screen", opacity: 0.8 }}
          >
            <image
              href={skeletonHologram.url}
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
