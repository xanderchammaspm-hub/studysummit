export type BoneZone = "skull" | "spine" | "limbs" | "feet";

export type SkeletonPart = {
  id: string;
  zone: BoneZone;
  title: string;
  sub: string;
  hint: string;
};

export type DocSection = { id: string; label: string; blurb: string; vault?: boolean };

export const DEFAULT_PARTS: SkeletonPart[] = [
  {
    id: "skull",
    zone: "skull",
    title: "Skull",
    sub: "Introduction",
    hint: "The thinking head — context, text, thesis.",
  },
  {
    id: "spine",
    zone: "spine",
    title: "Spine",
    sub: "Thesis Statement",
    hint: "The line that holds every paragraph upright.",
  },
  {
    id: "vertebrae",
    zone: "spine",
    title: "Vertebrae",
    sub: "Sub-Theses / Topic Sentences",
    hint: "Each disc is one argument, stacked in order.",
  },
  {
    id: "limbs",
    zone: "limbs",
    title: "Arms & Legs",
    sub: "Body Paragraphs & Evidence",
    hint: "Technique, quote, effect — where the essay does its work.",
  },
  {
    id: "feet",
    zone: "feet",
    title: "Feet",
    sub: "Conclusion",
    hint: "Where the argument lands and holds its ground.",
  },
];

export const DEFAULT_SECTIONS: DocSection[] = [
  { id: "improvement", label: "Areas of Improvement", blurb: "Recurring marker feedback and the fix for each." },
  { id: "power-verbs", label: "Power Verbs", blurb: "Verb + definition table for precise analysis." },
  { id: "techniques", label: "Techniques", blurb: "Technique bank with definitions and effect." },
  { id: "flowing-phrases", label: "Flowing Phrases", blurb: "Bridges between ideas, paragraphs and texts." },
  { id: "structure", label: "Structure", blurb: "Paragraph scaffolds and sentence order." },
  { id: "comparative", label: "Comparative Structure", blurb: "Integrated two-text paragraph frames." },
  { id: "exemplar", label: "Exemplar Analysis", blurb: "Band 6 samples annotated for what earns the marks." },
  {
    id: "memorisation",
    label: "Memorise By Heart",
    blurb: "Quotes, thesis lines and scaffolds to lock in.",
    vault: true,
  },
];

/** HUD copy shown on the image hot-spots. */
export const ZONE_LABELS: Record<BoneZone, string> = {
  skull: "SKULL // Opening & Hook",
  spine: "SPINE // Core Thesis & Transitions",
  limbs: "LIMBS // Body Paragraphs & Evidence",
  feet: "FEET // Resolution & Conclusion",
};
