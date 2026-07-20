import { useCallback, useEffect, useState } from "react";

export type Paper = { id: string; title: string; url?: string };
export type TrafficColor = "red" | "amber" | "green";
export type Topic = { id: string; title: string; status: TrafficColor };

export type SubjectState = {
  emoji: string;
  papers: Paper[];
  topics: Topic[];
};

const KEY = "study-hub-state-v1";

type Store = Record<string, SubjectState>;

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>();
let cache: Store | null = null;

function getStore(): Store {
  if (cache === null) cache = load();
  return cache;
}

function setStore(updater: (prev: Store) => Store) {
  const next = updater(getStore());
  cache = next;
  save(next);
  listeners.forEach((l) => l());
}

const defaultState: SubjectState = { emoji: "📘", papers: [], topics: [] };

export function useAllSubjects() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return getStore();
}

export function useSubject(id: string) {
  const store = useAllSubjects();
  const state = store[id] ?? defaultState;

  const update = useCallback(
    (patch: Partial<SubjectState> | ((s: SubjectState) => SubjectState)) => {
      setStore((prev) => {
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

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
