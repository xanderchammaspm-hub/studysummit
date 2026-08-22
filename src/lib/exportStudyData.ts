/**
 * Bundles per-paper highlights/notes and the English essay structure boards
 * into a single portable file (JSON for a full backup, CSV for spreadsheets).
 */

export type AnnotationRow = {
  kind: "highlight" | "note";
  paperId: string;
  page: number;
  colour: string;
  text: string;
  created: string;
};

export type StructureRow = {
  kind: "structure";
  board: string;
  index: number;
  title: string;
  detail: string;
};

const ANNOTATION_PREFIX = "summit-annotations:";
const STRUCTURE_PREFIX = "summit-english-structure-v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function collectAnnotations(): AnnotationRow[] {
  if (typeof window === "undefined") return [];
  const rows: AnnotationRow[] = [];
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(ANNOTATION_PREFIX)) continue;
    const paperId = key.slice(ANNOTATION_PREFIX.length);
    const data = safeParse<{
      highlights?: { page: number; colour?: string; text?: string; createdAt?: number }[];
      notes?: { page: number; body?: string; createdAt?: number }[];
    }>(localStorage.getItem(key));
    if (!data) continue;
    for (const h of data.highlights ?? []) {
      rows.push({
        kind: "highlight",
        paperId,
        page: h.page,
        colour: h.colour ?? "",
        text: h.text ?? "",
        created: h.createdAt ? new Date(h.createdAt).toISOString() : "",
      });
    }
    for (const n of data.notes ?? []) {
      rows.push({
        kind: "note",
        paperId,
        page: n.page,
        colour: "",
        text: n.body ?? "",
        created: n.createdAt ? new Date(n.createdAt).toISOString() : "",
      });
    }
  }
  return rows.sort((a, b) => a.paperId.localeCompare(b.paperId) || a.page - b.page);
}

export function collectStructureBoards(): StructureRow[] {
  if (typeof window === "undefined") return [];
  const rows: StructureRow[] = [];
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(STRUCTURE_PREFIX)) continue;
    const board = key.slice(STRUCTURE_PREFIX.length).replace(/^[:-]/, "") || "default";
    const steps = safeParse<unknown>(localStorage.getItem(key));
    const list = Array.isArray(steps)
      ? steps
      : Array.isArray((steps as { steps?: unknown[] } | null)?.steps)
        ? ((steps as { steps: unknown[] }).steps)
        : [];
    list.forEach((raw, i) => {
      const s = (raw ?? {}) as { title?: string; text?: string; detail?: string; body?: string };
      rows.push({
        kind: "structure",
        board,
        index: i + 1,
        title: s.title ?? "",
        detail: s.detail ?? s.text ?? s.body ?? "",
      });
    });
  }
  return rows.sort((a, b) => a.board.localeCompare(b.board) || a.index - b.index);
}

/* ------------------------ subject / term content ------------------------- */

export type SubjectRow = {
  kind: "paper" | "notes-doc" | "assessment" | "traffic-light" | "syllabus";
  year: string;
  subject: string;
  term: string;
  title: string;
  detail: string;
};

const STATE_KEY = "study-hub-state-v1";
const SUBJECTS_KEY = "study-hub-subjects-v1";
const TERM_LABELS: Record<string, string> = {
  T1: "Term 1",
  T2: "Term 2",
  T3: "Term 3",
  T4: "Term 4",
};

type AnyTerm = {
  papers?: { title?: string; url?: string }[];
  topics?: { title?: string; status?: string }[];
  assessments?: { title?: string; url?: string; due?: string }[];
  syllabus?: { text?: string; done?: boolean }[];
  notesUrl?: string;
};
type AnySubject = AnyTerm & { terms?: Record<string, AnyTerm> };

export function collectSubjectContent(): SubjectRow[] {
  if (typeof window === "undefined") return [];
  const state = safeParse<Record<string, AnySubject>>(localStorage.getItem(STATE_KEY)) ?? {};
  const subjects =
    safeParse<Record<string, { id: string; name: string }[]>>(
      localStorage.getItem(SUBJECTS_KEY),
    ) ?? {};

  const names = new Map<string, { year: string; name: string }>();
  for (const [year, list] of Object.entries(subjects)) {
    for (const s of list ?? []) names.set(s.id, { year, name: s.name || s.id });
  }

  const rows: SubjectRow[] = [];
  const push = (
    id: string,
    termKey: string,
    t: AnyTerm,
  ) => {
    const meta = names.get(id) ?? { year: "", name: id };
    if (!meta.name) return;
    const term = TERM_LABELS[termKey] ?? termKey;
    const base = { year: meta.year, subject: meta.name, term };
    for (const p of t.papers ?? [])
      rows.push({ ...base, kind: "paper", title: p.title ?? "", detail: p.url ?? "" });
    if (t.notesUrl)
      rows.push({ ...base, kind: "notes-doc", title: "Notes doc", detail: t.notesUrl });
    for (const a of t.assessments ?? [])
      rows.push({
        ...base,
        kind: "assessment",
        title: a.title ?? "",
        detail: [a.due ? `due ${a.due}` : "", a.url ?? ""].filter(Boolean).join(" • "),
      });
    for (const tp of t.topics ?? [])
      rows.push({ ...base, kind: "traffic-light", title: tp.title ?? "", detail: tp.status ?? "none" });
    for (const s of t.syllabus ?? [])
      rows.push({
        ...base,
        kind: "syllabus",
        title: s.text ?? "",
        detail: s.done ? "done" : "not done",
      });
  };

  for (const [id, subject] of Object.entries(state)) {
    if (!subject) continue;
    if (subject.terms) {
      for (const [k, t] of Object.entries(subject.terms)) if (t) push(id, k, t);
    } else {
      push(id, "T1", subject);
    }
  }
  return rows;
}

export function buildStudyBundle() {
  return {
    exportedAt: new Date().toISOString(),
    app: "Summit",
    annotations: collectAnnotations(),
    structureBoards: collectStructureBoards(),
    subjects: collectSubjectContent(),
  };
}

function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildStudyCsv() {
  const header = [
    "kind",
    "year",
    "subject",
    "term",
    "source",
    "page_or_step",
    "title_or_colour",
    "text",
    "created",
  ];
  const lines = [header.join(",")];
  for (const a of collectAnnotations()) {
    lines.push(
      [a.kind, "", "", "", a.paperId, a.page, a.colour, a.text, a.created].map(csvCell).join(","),
    );
  }
  for (const s of collectStructureBoards()) {
    lines.push(
      [s.kind, "", "", "", s.board, s.index, s.title, s.detail, ""].map(csvCell).join(","),
    );
  }
  for (const r of collectSubjectContent()) {
    lines.push(
      [r.kind, r.year, r.subject, r.term, r.subject, "", r.title, r.detail, ""]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}


export function downloadFile(name: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Count of exportable rows, for the settings blurb. */
export function studyDataCount() {
  return (
    collectAnnotations().length + collectStructureBoards().length + collectSubjectContent().length
  );
}
