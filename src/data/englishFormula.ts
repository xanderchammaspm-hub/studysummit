export type SkeletonPart = { id: string; title: string; sub: string; hint: string };
export type DocSection = { id: string; label: string; blurb: string; vault?: boolean };
export type WritingMode = {
  id: string;
  label: string;
  tagline: string;
  parts: SkeletonPart[];
  sections: DocSection[];
};

const bone = (id: string, title: string, sub: string, hint: string): SkeletonPart => ({
  id,
  title,
  sub,
  hint,
});

export const MODES: WritingMode[] = [
  {
    id: "analytical",
    label: "Essay",
    tagline: "Thesis-driven textual analysis",
    parts: [
      bone("skull", "Skull", "Introduction", "The thinking head — context, text, thesis."),
      bone("spine", "Spine", "Thesis Statement", "The line that holds every paragraph upright."),
      bone("vertebrae", "Vertebrae", "Sub-Theses / Topic Sentences", "Each disc is one argument, stacked in order."),
      bone("limbs", "Arms & Legs", "Body Paragraphs & Evidence", "Technique, quote, effect — where the essay does its work."),
      bone("feet", "Feet", "Conclusion", "Where the argument lands and holds its ground."),
    ],
    sections: [
      { id: "improvement", label: "Areas of Improvement", blurb: "Recurring marker feedback and the fix for each." },
      { id: "power-verbs", label: "Power Verbs", blurb: "Verb + definition table for precise analysis." },
      { id: "techniques", label: "Techniques", blurb: "Technique bank with definitions and effect." },
      { id: "flowing-phrases", label: "Flowing Phrases", blurb: "Bridges between ideas, paragraphs and texts." },
      { id: "structure", label: "Structure", blurb: "Paragraph scaffolds and sentence order." },
      { id: "comparative", label: "Comparative Structure", blurb: "Integrated two-text paragraph frames." },
      
      { id: "exemplar", label: "Exemplar Analysis", blurb: "Band 6 samples annotated for what earns the marks." },
      { id: "memorisation", label: "Memorise By Heart", blurb: "Quotes, thesis lines and scaffolds to lock in.", vault: true },
    ],
  },
  {
    id: "imaginative",
    label: "Imaginative Writing",
    tagline: "Crafted narrative and voice",
    parts: [
      bone("skull", "Skull", "Atmospheric Hook", "Open inside a moment — image, sound, tension."),
      bone("spine", "Spine", "Internal Conflict", "The unspoken want driving every line."),
      bone("vertebrae", "Vertebrae", "Scene Beats", "Each beat escalates pressure by one degree."),
      bone("limbs", "Arms & Legs", "Climax Shift", "The turn — action, revelation, change in the character."),
      bone("feet", "Feet", "Motif Echo", "Close by returning to the opening image, transformed."),
    ],
    sections: [
      { id: "memorisation", label: "Memorise By Heart", blurb: "Quotes, thesis lines and scaffolds to lock in.", vault: true },
    ],
  },
  {
    id: "discursive",
    label: "Discursive Writing",
    tagline: "Exploratory, reflective thinking",
    parts: [
      bone("skull", "Skull", "Personal Hook", "A specific personal moment that raises the question."),
      bone("spine", "Spine", "Perspective A", "The first way of seeing it, taken seriously."),
      bone("vertebrae", "Vertebrae", "Perspective B", "The counter-view, given equal curiosity."),
      bone("limbs", "Arms & Legs", "Exploration & Anecdote", "Analogy, evidence and lived detail widening the lens."),
      bone("feet", "Feet", "Philosophical Synthesis", "Not resolution — an earned, open-ended insight."),
    ],
    sections: [
      { id: "memorisation", label: "Memorise By Heart", blurb: "Quotes, thesis lines and scaffolds to lock in.", vault: true },
    ],
  },
  {
    id: "persuasive",
    label: "Persuasive Writing",
    tagline: "Rhetorical force and escalation",
    parts: [
      bone("skull", "Skull", "Attention Hook", "Statistic, provocation or image that stops the reader."),
      bone("spine", "Spine", "Core Problem", "The single contention everything serves."),
      bone("vertebrae", "Vertebrae", "Argument Escalation", "Each argument raises the stakes on the last."),
      bone("limbs", "Arms & Legs", "Counter-Argument Dismantler", "Concede, then dismantle with evidence."),
      bone("feet", "Feet", "Call to Action", "The demand — specific, urgent, achievable."),
    ],
    sections: [
      { id: "memorisation", label: "Memorise By Heart", blurb: "Quotes, thesis lines and scaffolds to lock in.", vault: true },
    ],
  },
  {
    id: "reflection",
    label: "Reflection Statement",
    tagline: "Justifying your craft choices",
    parts: [
      bone("skull", "Skull", "Artistic Intent", "What you set out to make the reader feel and why."),
      bone("spine", "Spine", "Stylistic Choice Analysis", "Your own techniques, quoted and deconstructed."),
      bone("vertebrae", "Vertebrae", "Structural Justification", "Why the form, order and shape serve the intent."),
      bone("limbs", "Arms & Legs", "Prescribed Text Links", "How Module C authors shaped each decision."),
      bone("feet", "Feet", "Final Evaluation", "Honest judgement of what worked and what you refined."),
    ],
    sections: [
      { id: "memorisation", label: "Memorise By Heart", blurb: "Quotes, thesis lines and scaffolds to lock in.", vault: true },
    ],
  },
  {
    id: "short-answer",
    label: "Short Answer",
    tagline: "1–6 mark precision responses",
    parts: [],
    sections: [
      { id: "formulas", label: "Response Formulas", blurb: "1–6 mark scaffolds, mark allocation and timing." },
      { id: "mark-allocation", label: "Mark Allocation", blurb: "What each mark band expects, line by line." },
      { id: "exemplars", label: "Exemplar Responses", blurb: "Annotated model answers and why they score." },
      { id: "notes", label: "Notes", blurb: "Free-form working space." },
      { id: "memorisation", label: "Memorise By Heart", blurb: "Quotes, thesis lines and scaffolds to lock in.", vault: true },
    ],
  },
];

