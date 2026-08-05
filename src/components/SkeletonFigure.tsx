import { motion } from "framer-motion";
import {
  FRONTAL_VIEWBOX as VB,
  MIRROR_TRANSFORM,
  ZONE_BOXES,
  CENTER_BONES,
  SIDE_BONES,
  type Bone,
  type BoneZone,
} from "@/assets/skeletonFrontal";

export const ZONE_IDS: BoneZone[] = ["skull", "spine", "vertebrae", "limbs", "feet"];

type Rect = [number, number, number, number];

/** Pointer hit areas, aligned to the vector skeleton inside the 400x1080 box. */
const HIT_RECTS: Record<BoneZone, Rect[]> = {
  skull: [[136, 18, 128, 168]],
  spine: [[120, 188, 160, 200]],
  vertebrae: [[112, 470, 176, 240]],
  limbs: [
    [40, 240, 96, 470],
    [264, 240, 96, 470],
    [118, 712, 164, 288],
  ],
  feet: [[96, 1000, 208, 76]],
};

const LABELS: Record<BoneZone, { text: string; x: number; y: number; anchor: "start" | "end" }> = {
  skull: { text: "CRANIUM · INTRO", x: 292, y: 86, anchor: "start" },
  spine: { text: "THORAX · THESIS", x: 320, y: 300, anchor: "start" },
  vertebrae: { text: "LUMBAR · SUB-THESES", x: 300, y: 560, anchor: "start" },
  limbs: { text: "APPENDICULAR · BODY", x: 384, y: 470, anchor: "end" },
  feet: { text: "TARSALS · CONCLUSION", x: 328, y: 1040, anchor: "start" },
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

function Bones({
  bones,
  lit,
  stroke,
  strokeWidth,
  fill,
  opacityFor,
}: {
  bones: Bone[];
  lit: BoneZone | null;
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacityFor: (b: Bone) => number;
}) {
  return (
    <>
      {bones.map((b, i) => (
        <path
          key={i}
          d={b.d}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={opacityFor(b)}
          style={{ transition: "opacity 320ms ease" }}
        />
      ))}
    </>
  );
}

/** Full figure: centre bones + mirrored side bones. */
function Figure(props: Omit<Parameters<typeof Bones>[0], "bones">) {
  return (
    <>
      <Bones {...props} bones={CENTER_BONES} />
      <g transform={MIRROR_TRANSFORM}>
        <Bones {...props} bones={SIDE_BONES} />
      </g>
      <Bones {...props} bones={SIDE_BONES} />
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
  const lit = (active ?? hovered) as BoneZone | null;
  const label = lit ? LABELS[lit] : null;
  const box = lit ? ZONE_BOXES[lit] : null;

  const dim = (b: Bone) => (!lit ? 0.92 : b.zone === lit ? 1 : 0.5);

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className={className}
      role="img"
      shapeRendering="geometricPrecision"
      aria-label="Interactive holographic anatomical essay skeleton, frontal view"
    >
      <defs>
        <radialGradient id="skel-aura" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0%" stopColor="oklch(0.55 0.19 300 / 0.10)" />
          <stop offset="60%" stopColor="oklch(0.5 0.18 300 / 0.04)" />
          <stop offset="100%" stopColor="oklch(0.2 0.06 290 / 0)" />
        </radialGradient>

        {/* Tight halo hugging the bone edges — soft falloff, no clipping */}
        <filter id="bone-halo" x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.2" result="near" />
          <feGaussianBlur stdDeviation="6" result="far" />
          <feMerge>
            <feMergeNode in="far" />
            <feMergeNode in="near" />
          </feMerge>
        </filter>

        {/* Shimmer band travelling down the lit region */}
        <linearGradient id="skel-shimmer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.85" />
          <stop offset="55%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="0 -1; 0 1"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <mask id="skel-shimmer-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={VB.w} height={VB.h}>
          <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#skel-shimmer)" />
        </mask>
      </defs>

      <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#skel-aura)" aria-hidden pointerEvents="none" />

      <motion.g
        style={{ originX: 0, originY: 0 }}
        animate={{ x: t.x, y: t.y, scale: t.scale }}
        transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.9 }}
      >
        {/* Close halo */}
        <g filter="url(#bone-halo)" opacity={lit ? 0.55 : 0.42} pointerEvents="none">
          <Figure
            lit={lit}
            stroke="oklch(0.62 0.21 300)"
            strokeWidth={1.6}
            fill="none"
            opacityFor={dim}
          />
        </g>

        {/* Crisp outline pass */}
        <g pointerEvents="none">
          <Figure
            lit={lit}
            stroke="oklch(0.86 0.13 300)"
            strokeWidth={1.15}
            fill="oklch(0.55 0.18 300 / 0.06)"
            opacityFor={dim}
          />
        </g>

        {/* Hover shimmer: same outlines, brighter, swept by a moving band */}
        {lit && (
          <g mask="url(#skel-shimmer-mask)" pointerEvents="none" opacity={0.9}>
            <Figure
              lit={lit}
              stroke="oklch(0.95 0.08 300)"
              strokeWidth={1.15}
              fill="none"
              opacityFor={(b) => (b.zone === lit ? 1 : 0)}
            />
          </g>
        )}

        {/* Anatomical data callout */}
        {label && box && (
          <g pointerEvents="none" opacity={0.85}>
            <circle
              cx={box.x + box.w / 2}
              cy={box.y + box.h / 2}
              r={3}
              fill="oklch(0.9 0.1 300)"
            />
            <path
              d={`M ${box.x + box.w / 2},${box.y + box.h / 2} L ${label.anchor === "start" ? label.x - 10 : label.x + 10},${label.y - 4}`}
              stroke="oklch(0.75 0.14 300 / 0.55)"
              strokeWidth="0.8"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              fill="oklch(0.88 0.09 300)"
              fontSize="13"
              letterSpacing="2"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
            >
              {label.text}
            </text>
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
