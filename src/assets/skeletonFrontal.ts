// Anatomical skeleton — strict anterior (frontal) view, perfectly symmetric.
// Half the bones are authored on the left side and mirrored about x = 200,
// which guarantees 0° rotation and exact bilateral symmetry.

export const FRONTAL_VIEWBOX = { w: 400, h: 1080 };
export const MIRROR_TRANSFORM = "translate(400,0) scale(-1,1)";

export type BoneZone = "skull" | "spine" | "vertebrae" | "limbs" | "feet";
export type Bone = { zone: BoneZone; d: string };

/** Ellipse expressed as a path. */
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 ${-rx * 2},0 Z`;

/** Tapered long bone with rounded epiphyses. */
const bone = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w1: number,
  w2 = w1,
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const a1x = x1 + nx * w1;
  const a1y = y1 + ny * w1;
  const a2x = x2 + nx * w2;
  const a2y = y2 + ny * w2;
  const b2x = x2 - nx * w2;
  const b2y = y2 - ny * w2;
  const b1x = x1 - nx * w1;
  const b1y = y1 - ny * w1;
  return [
    `M ${a1x},${a1y}`,
    `L ${a2x},${a2y}`,
    `A ${w2},${w2} 0 0 1 ${b2x},${b2y}`,
    `L ${b1x},${b1y}`,
    `A ${w1},${w1} 0 0 1 ${a1x},${a1y}`,
    "Z",
  ].join(" ");
};

/** Small vertebral body. */
const vert = (cy: number, w: number, h: number) =>
  `M ${200 - w},${cy - h / 2} h ${w * 2} a 4,4 0 0 1 0,${h} h ${-w * 2} a 4,4 0 0 1 0,${-h} Z`;

/* ---------------- Centre-line bones (drawn once) ---------------- */

export const CENTER_BONES: Bone[] = [
  // Cranium + face
  { zone: "skull", d: ell(200, 88, 60, 68) },
  { zone: "skull", d: ell(176, 92, 15, 12) },
  { zone: "skull", d: ell(224, 92, 15, 12) },
  { zone: "skull", d: "M 200,108 L 189,132 h 22 Z" },
  {
    zone: "skull",
    d: "M 158,138 c 6,26 24,40 42,40 c 18,0 36,-14 42,-40 c -14,10 -28,14 -42,14 c -14,0 -28,-4 -42,-14 Z",
  },
  { zone: "skull", d: "M 170,152 h 60 M 200,152 v 24" },

  // Cervical spine
  ...[0, 1, 2, 3, 4].map((i) => ({
    zone: "spine" as const,
    d: vert(190 + i * 12, 15, 8),
  })),

  // Thoracic spine (behind sternum)
  ...Array.from({ length: 12 }, (_, i) => ({
    zone: "spine" as const,
    d: vert(258 + i * 18, 17, 11),
  })),

  // Sternum
  {
    zone: "spine",
    d: "M 186,270 h 28 v 76 l -14,34 l -14,-34 Z",
  },

  // Lumbar spine
  ...Array.from({ length: 5 }, (_, i) => ({
    zone: "vertebrae" as const,
    d: vert(492 + i * 24, 24, 17),
  })),

  // Sacrum + coccyx
  {
    zone: "vertebrae",
    d: "M 172,600 h 56 l -10,72 l -18,26 l -18,-26 Z",
  },
];

/* ---------------- Left-side bones (mirrored to the right) ---------------- */

const RIBS: Bone[] = Array.from({ length: 10 }, (_, i) => {
  const y = 268 + i * 18;
  const spread = 62 + Math.sin(((i + 1) / 11) * Math.PI) * 52;
  const drop = 26 + i * 5;
  return {
    zone: "spine" as const,
    d: `M 183,${y} C ${200 - spread},${y + 4} ${200 - spread - 4},${y + drop} ${
      200 - spread * (i > 6 ? 0.55 : 0.72)
    },${y + drop + 16}`,
  };
});

export const SIDE_BONES: Bone[] = [
  // Clavicle + scapula
  { zone: "spine", d: bone(186, 250, 108, 262, 5, 4) },
  {
    zone: "spine",
    d: "M 106,264 c -18,10 -24,34 -18,56 c 16,-6 28,-22 32,-46 Z",
  },
  ...RIBS,

  // Arm: humerus, radius, ulna, carpus, metacarpals, phalanges, thumb
  { zone: "limbs", d: bone(103, 272, 88, 452, 11, 8) },
  { zone: "limbs", d: bone(83, 462, 70, 618, 7, 5) },
  { zone: "limbs", d: bone(96, 462, 84, 620, 6, 4.5) },
  { zone: "limbs", d: ell(78, 634, 14, 11) },
  // metacarpals
  ...Array.from({ length: 4 }, (_, i) => ({
    zone: "limbs" as const,
    d: bone(72 + i * 6, 646, 66 + i * 8, 684, 2.6, 2.2),
  })),
  // proximal + distal phalanges
  ...Array.from({ length: 4 }, (_, i) => ({
    zone: "limbs" as const,
    d: bone(66 + i * 8, 688, 62 + i * 9, 710, 2.1, 1.7),
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    zone: "limbs" as const,
    d: bone(62 + i * 9, 713, 59 + i * 9.5, 728, 1.7, 1.3),
  })),
  // thumb
  { zone: "limbs", d: bone(89, 648, 98, 676, 2.8, 2.3) },
  { zone: "limbs", d: bone(98, 678, 104, 700, 2.3, 1.8) },


  // Pelvis (iliac wing + ischium)
  {
    zone: "vertebrae",
    d: "M 176,606 C 142,598 110,620 102,654 C 96,682 110,702 134,710 C 156,716 170,704 176,682 C 182,656 182,630 176,606 Z",
  },
  {
    zone: "vertebrae",
    d: "M 136,712 c -12,14 -12,36 4,46 c 16,10 34,0 40,-18 l -18,-26 Z",
  },

  // Leg: femur, patella, tibia, fibula
  { zone: "limbs", d: bone(146, 726, 158, 902, 15, 11) },
  { zone: "limbs", d: ell(158, 916, 13, 12) },
  { zone: "limbs", d: bone(156, 930, 158, 1006, 12, 8) },
  { zone: "limbs", d: bone(174, 936, 176, 1004, 6, 5) },

  // Foot: tarsals, metatarsals, phalanges
  { zone: "feet", d: ell(160, 1018, 18, 12) },
  ...Array.from({ length: 5 }, (_, i) => ({
    zone: "feet" as const,
    d: bone(150 + i * 8, 1026, 140 + i * 10, 1058, 3, 2.4),
  })),
  { zone: "feet", d: "M 176,1024 c 12,6 16,18 10,28 c -8,10 -22,6 -26,-6 Z" },
];

/** Calibrated against the rendered hologram inside the 400x1080 viewBox. */
export const ZONE_BOXES: Record<BoneZone, { x: number; y: number; w: number; h: number }> = {
  skull: { x: 142, y: 66, w: 116, h: 136 },
  spine: { x: 96, y: 188, w: 208, h: 218 },
  vertebrae: { x: 110, y: 392, w: 180, h: 188 },
  limbs: { x: 30, y: 232, w: 340, h: 666 },
  feet: { x: 92, y: 886, w: 216, h: 116 },
};

