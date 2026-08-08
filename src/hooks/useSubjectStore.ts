import { useCallback, useEffect, useState } from "react";

export type Paper = { id: string; title: string; url?: string };
export type TrafficColor = "none" | "red" | "amber" | "green";
export type Topic = { id: string; title: string; status: TrafficColor };
export type Assessment = {
  id: string;
  title: string;
  url?: string;
  due?: string; // ISO date (yyyy-mm-dd)
};

export type SyllabusPoint = { id: string; text: string; done: boolean };

export type TermKey = "T1" | "T2" | "T3" | "T4";

export type TermState = {
  papers: Paper[];
  topics: Topic[];
  assessments: Assessment[];
  syllabus: SyllabusPoint[];
  notesUrl?: string;
};

export type SubjectState = {
  emoji: string;
  color?: string;
  papers: Paper[];
  topics: Topic[];
  assessments: Assessment[];
  notesUrl?: string;
  terms?: Partial<Record<TermKey, TermState>>;
};

export type YearKey = "Year 11" | "Year 12";
export type SubjectMeta = { id: string; name: string };
export type SubjectsByYear = Record<YearKey, SubjectMeta[]>;

export const TERMS_BY_YEAR: Record<YearKey, TermKey[]> = {
  "Year 11": ["T1", "T2", "T3"],
  "Year 12": ["T1", "T2", "T3", "T4"],
};

export const TERM_LABEL: Record<TermKey, string> = {
  T1: "Term 1",
  T2: "Term 2",
  T3: "Term 3",
  T4: "Term 4",
};

const emptyTerm: TermState = { papers: [], topics: [], assessments: [], syllabus: [] };

/** Terms for a subject, migrating any legacy top-level content into Term 1. */
export function subjectTerms(raw?: SubjectState): Record<TermKey, TermState> {
  const base: Record<TermKey, TermState> = {
    T1: { ...emptyTerm },
    T2: { ...emptyTerm },
    T3: { ...emptyTerm },
    T4: { ...emptyTerm },
  };
  if (!raw) return base;
  if (raw.terms) {
    for (const k of Object.keys(base) as TermKey[]) {
      const t = raw.terms[k];
      if (t) {
        base[k] = {
          papers: t.papers ?? [],
          topics: t.topics ?? [],
          assessments: t.assessments ?? [],
          syllabus: t.syllabus ?? [],
          notesUrl: t.notesUrl,
        };
      }
    }
    return base;
  }
  base.T1 = {
    papers: raw.papers ?? [],
    topics: raw.topics ?? [],
    assessments: raw.assessments ?? [],
    syllabus: [],
    notesUrl: raw.notesUrl,
  };
  return base;
}

/** All papers/topics/assessments across every term, for stats + search. */
export function flattenSubject(raw?: SubjectState) {
  const t = subjectTerms(raw);
  const keys: TermKey[] = ["T1", "T2", "T3", "T4"];
  return {
    papers: keys.flatMap((k) => t[k].papers),
    topics: keys.flatMap((k) => t[k].topics),
    assessments: keys.flatMap((k) => t[k].assessments),
    syllabus: keys.flatMap((k) => t[k].syllabus),
  };
}



const STATE_KEY = "study-hub-state-v1";
const SUBJECTS_KEY = "study-hub-subjects-v1";

type Store = Record<string, SubjectState>;

const defaultSubjects: SubjectsByYear = {
  "Year 11": Array.from({ length: 6 }, (_, i) => ({
    id: `y11-s${i + 1}`,
    name: "",
  })),
  "Year 12": Array.from({ length: 6 }, (_, i) => ({
    id: `y12-s${i + 1}`,
    name: "",
  })),
};

function loadState(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function loadSubjects(): SubjectsByYear {
  if (typeof window === "undefined") return defaultSubjects;
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    if (!raw) return defaultSubjects;
    const parsed = JSON.parse(raw) as SubjectsByYear;
    return {
      "Year 11": parsed["Year 11"] ?? defaultSubjects["Year 11"],
      "Year 12": parsed["Year 12"] ?? defaultSubjects["Year 12"],
    };
  } catch {
    return defaultSubjects;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const stateListeners = new Set<() => void>();
const subjectListeners = new Set<() => void>();

let stateCache: Store | null = null;
let subjectsCache: SubjectsByYear | null = null;

function getState(): Store {
  if (stateCache === null) stateCache = loadState();
  return stateCache;
}

function setState(updater: (prev: Store) => Store) {
  const next = updater(getState());
  stateCache = next;
  save(STATE_KEY, next);
  stateListeners.forEach((l) => l());
}

function getSubjectsStore(): SubjectsByYear {
  if (subjectsCache === null) subjectsCache = loadSubjects();
  return subjectsCache;
}

function setSubjectsStore(
  updater: (prev: SubjectsByYear) => SubjectsByYear,
) {
  const next = updater(getSubjectsStore());
  subjectsCache = next;
  save(SUBJECTS_KEY, next);
  subjectListeners.forEach((l) => l());
}

const defaultState: SubjectState = { emoji: "📘", papers: [], topics: [], assessments: [] };

export function useAllSubjectStates() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    stateListeners.add(l);
    return () => {
      stateListeners.delete(l);
    };
  }, []);
  return getState();
}

export function useSubject(id: string) {
  const store = useAllSubjectStates();
  const raw = store[id] ?? defaultState;
  const state: SubjectState = {
    emoji: raw.emoji ?? "📘",
    color: raw.color,
    papers: raw.papers ?? [],
    topics: raw.topics ?? [],
    assessments: raw.assessments ?? [],
    notesUrl: raw.notesUrl,
  };

  const update = useCallback(
    (patch: Partial<SubjectState> | ((s: SubjectState) => SubjectState)) => {
      setState((prev) => {
        const cur = prev[id] ?? defaultState;
        const next =
          typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
        return { ...prev, [id]: next };
      });
    },
    [id],
  );

  return { state, update };
}

/** Per-term slice of a subject (Past papers, notes, assessments, traffic lights). */
export function useSubjectTerm(id: string, term: TermKey) {
  const store = useAllSubjectStates();
  const raw = store[id];
  const terms = subjectTerms(raw);
  const state = terms[term];

  const update = useCallback(
    (patch: Partial<TermState> | ((s: TermState) => TermState)) => {
      setState((prev) => {
        const cur = prev[id] ?? defaultState;
        const curTerms = subjectTerms(cur);
        const curTerm = curTerms[term];
        const nextTerm =
          typeof patch === "function" ? patch(curTerm) : { ...curTerm, ...patch };
        const next: SubjectState = {
          emoji: cur.emoji ?? "📘",
          color: cur.color,
          papers: [],
          topics: [],
          assessments: [],
          notesUrl: undefined,
          terms: { ...curTerms, [term]: nextTerm },
        };
        return { ...prev, [id]: next };
      });
    },
    [id, term],
  );

  return { state, update };
}


export function useSubjects() {
  const [, setTick] = useState(0);
  // First render must match the server output, so hold the defaults until mount.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    const l = () => setTick((n) => n + 1);
    subjectListeners.add(l);
    return () => {
      subjectListeners.delete(l);
    };
  }, []);
  return hydrated ? getSubjectsStore() : defaultSubjects;
}


export function addSubject(year: YearKey, name: string) {
  const id = `${year === "Year 11" ? "y11" : "y12"}-${uid()}`;
  setSubjectsStore((prev) => ({
    ...prev,
    [year]: [...prev[year], { id, name }],
  }));
  return id;
}

export function renameSubject(year: YearKey, id: string, name: string) {
  setSubjectsStore((prev) => ({
    ...prev,
    [year]: prev[year].map((s) => (s.id === id ? { ...s, name } : s)),
  }));
}

export function deleteSubject(year: YearKey, id: string) {
  setSubjectsStore((prev) => ({
    ...prev,
    [year]: prev[year].filter((s) => s.id !== id),
  }));
  setState((prev) => {
    const { [id]: _drop, ...rest } = prev;
    return rest;
  });
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* --------------------- Quick links (Sudoku, Atomi, custom) --------------------- */

export type QuickLink = { id: string; label: string; url: string; emoji?: string; iconUrl?: string };

const LINKS_KEY = "study-hub-links-v1";
const defaultLinks: QuickLink[] = [
  { id: "studoco", label: "Studoco", url: "", emoji: "📚" },
  { id: "atomi", label: "Atomi", url: "", emoji: "⚛️" },
  { id: "thsc", label: "THSC", url: "", emoji: "📝" },
  { id: "nesa", label: "NESA", url: "", emoji: "🏛️" },
  { id: "oakhill", label: "Oakhill Past Papers", url: "", emoji: "🗂️" },
  { id: "leibniz", label: "Leibniz HSC", url: "", emoji: "🧮" },
];

function loadLinks(): QuickLink[] {
  if (typeof window === "undefined") return defaultLinks;
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (!raw) return defaultLinks;
    const parsed = JSON.parse(raw) as QuickLink[];
    if (!Array.isArray(parsed) || !parsed.length) return defaultLinks;
    // migrate: sudoku -> studoco, and ensure new default tiles exist
    const migrated = parsed.map((l) =>
      l.id === "sudoku"
        ? { ...l, id: "studoco", label: "Studoco", emoji: l.iconUrl ? l.emoji : "📚" }
        : l,
    );
    for (const d of defaultLinks) {
      if (!migrated.some((l) => l.id === d.id)) migrated.push(d);
    }
    return migrated;
  } catch {
    return defaultLinks;
  }
}


let linksCache: QuickLink[] | null = null;
const linkListeners = new Set<() => void>();

function getLinks(): QuickLink[] {
  if (linksCache === null) linksCache = loadLinks();
  return linksCache;
}

function setLinks(updater: (prev: QuickLink[]) => QuickLink[]) {
  const next = updater(getLinks());
  linksCache = next;
  save(LINKS_KEY, next);
  linkListeners.forEach((l) => l());
}

export function useQuickLinks() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    linkListeners.add(l);
    return () => {
      linkListeners.delete(l);
    };
  }, []);
  return getLinks();
}

export function updateQuickLink(id: string, patch: Partial<QuickLink>) {
  setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

export function addQuickLink(label: string, url: string, emoji?: string) {
  setLinks((prev) => [...prev, { id: uid(), label, url, emoji }]);
}

export function removeQuickLink(id: string) {
  setLinks((prev) => prev.filter((l) => l.id !== id));
}

