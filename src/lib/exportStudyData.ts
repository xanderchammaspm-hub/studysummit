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

export function buildStudyBundle() {
  return {
    exportedAt: new Date().toISOString(),
    app: "Summit",
    annotations: collectAnnotations(),
    structureBoards: collectStructureBoards(),
  };
}

function csvCell(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildStudyCsv() {
  const header = ["kind", "source", "page_or_step", "title_or_colour", "text", "created"];
  const lines = [header.join(",")];
  for (const a of collectAnnotations()) {
    lines.push([a.kind, a.paperId, a.page, a.colour, a.text, a.created].map(csvCell).join(","));
  }
  for (const s of collectStructureBoards()) {
    lines.push([s.kind, s.board, s.index, s.title, s.detail, ""].map(csvCell).join(","));
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
  return collectAnnotations().length + collectStructureBoards().length;
}
