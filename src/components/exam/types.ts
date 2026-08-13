export type QType = "mcq" | "short" | "extended";

export type Paper = {
  id: string;
  owner_id: string | null;
  is_library: boolean;
  title: string;
  subject: string;
  year: number | null;
  exam_type: string;
  description: string | null;
  file_path?: string | null;
  created_at: string;
};


export type Question = {
  id: string;
  paper_id: string;
  position: number;
  qtype: QType;
  prompt: string;
  options: string[];
  correct_option: number | null;
  marks: number;
  criteria: string | null;
  exemplar: string | null;
  topic: string | null;
};

export type AnswerRow = {
  id: string;
  attempt_id: string;
  question_id: string | null;
  question_prompt: string;
  qtype: QType;
  topic: string | null;
  subject: string | null;
  response: string;
  awarded: number;
  max_marks: number;
  feedback: string | null;
  missing_keywords: string[];
  exemplar: string | null;
  is_mistake: boolean;
  resolved: boolean;
  created_at: string;
};

export type Attempt = {
  id: string;
  paper_id: string;
  paper_title: string;
  subject: string;
  started_at: string;
  completed_at: string | null;
  awarded_marks: number;
  total_marks: number;
};

/** Normalised rectangle (0-1 relative to the rendered page box). */
export type NormRect = { x: number; y: number; w: number; h: number };

export type HighlightColour = "purple" | "gold" | "green" | "red";

export type Highlight = {
  id: string;
  page: number;
  rects: NormRect[];
  colour: HighlightColour;
  text: string;
  createdAt: number;
};

export type PaperNote = {
  id: string;
  page: number;
  /** Normalised 0-1 position on the page. */
  x: number;
  y: number;
  body: string;
  createdAt: number;
};

export type PaperAnnotations = {
  highlights: Highlight[];
  notes: PaperNote[];
};

export const HIGHLIGHT_COLOURS: Record<HighlightColour, string> = {
  purple: "oklch(0.72 0.2 300)",
  gold: "oklch(0.85 0.16 90)",
  green: "oklch(0.78 0.16 145)",
  red: "oklch(0.7 0.2 25)",
};

export const SUBJECT_ACCENT: Record<string, string> = {
  "English Advanced": "oklch(0.72 0.2 300)",
  "Mathematics Advanced": "oklch(0.8 0.14 200)",
  Biology: "oklch(0.78 0.16 145)",
};

export function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}
