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
  // Cranium (tapered calvaria + facial skeleton)
  {
    zone: "skull",
    d: "M 200,20 C 236,20 262,48 262,86 C 262,110 253,128 240,142 C 236,158 222,172 200,174 C 178,172 164,158 160,142 C 147,128 138,110 138,86 C 138,48 164,20 200,20 Z",
  },
  // Orbits (angled, with superior rim)
  {
    zone: "skull",
    d: "M 165,87 c 3,-9 11,-13 19,-12 c 8,1 12,7 11,15 c -1,9 -8,14 -16,14 c -9,0 -16,-8 -14,-17 Z",
  },
  {
    zone: "skull",
    d: "M 235,87 c -3,-9 -11,-13 -19,-12 c -8,1 -12,7 -11,15 c 1,9 8,14 16,14 c 9,0 16,-8 14,-17 Z",
  },
  // Zygomatic arches
  { zone: "skull", d: "M 160,110 c 8,7 15,10 22,10 l 0,4 c -9,0 -17,-4 -24,-11 Z" },
  { zone: "skull", d: "M 240,110 c -8,7 -15,10 -22,10 l 0,4 c 9,0 17,-4 24,-11 Z" },
  // Nasal aperture
  { zone: "skull", d: "M 200,112 L 192,133 h 16 Z" },
  // Maxilla + mandible (rami rising to the temporomandibular joints)
  { zone: "skull", d: "M 176,138 h 48 v 8 h -48 Z" },
  {
    zone: "skull",
    d: "M 168,132 l 6,0 c 1,15 4,24 10,29 c 5,4 10,6 16,6 c 6,0 11,-2 16,-6 c 6,-5 9,-14 10,-29 l 6,0 c -1,19 -5,31 -13,37 c -6,5 -12,7 -19,7 c -7,0 -13,-2 -19,-7 c -8,-6 -12,-18 -13,-37 Z",
  },




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


  // Pelvis: iliac wing, acetabulum, pubic + ischial rami
  {
    zone: "vertebrae",
    d: "M 178,602 C 150,592 118,606 106,636 C 98,658 104,682 122,694 C 140,706 158,700 166,682 C 174,660 178,630 178,602 Z",
  },
  { zone: "vertebrae", d: ell(128, 700, 15, 14) },
  {
    zone: "vertebrae",
    d: "M 141,712 c -9,12 -8,30 5,38 c 14,9 30,1 36,-14 l -17,-24 Z",
  },
  { zone: "vertebrae", d: bone(146, 706, 182, 700, 5, 6) },


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

/** Calibrated against the vector geometry above, inside the 400x1080 viewBox. */
export const ZONE_BOXES: Record<BoneZone, { x: number; y: number; w: number; h: number }> = {
  skull: { x: 138, y: 18, w: 124, h: 168 },
  spine: { x: 84, y: 186, w: 232, h: 300 },
  vertebrae: { x: 100, y: 478, w: 200, h: 288 },
  limbs: { x: 48, y: 250, w: 304, h: 760 },
  feet: { x: 118, y: 998, w: 164, h: 76 },

};

