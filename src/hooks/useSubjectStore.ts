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

export type SubjectState = {
  emoji: string;
  papers: Paper[];
  topics: Topic[];
  assessments: Assessment[];
};

export type YearKey = "Year 11" | "Year 12";
export type SubjectMeta = { id: string; name: string };
export type SubjectsByYear = Record<YearKey, SubjectMeta[]>;

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

const defaultState: SubjectState = { emoji: "📘", papers: [], topics: [] };

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
  const state = store[id] ?? defaultState;

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

export function useSubjects() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    subjectListeners.add(l);
    return () => {
      subjectListeners.delete(l);
    };
  }, []);
  return getSubjectsStore();
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
