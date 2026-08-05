import { useCallback, useEffect, useState } from "react";

export type AccentKey = "purple" | "gold" | "violet";
export type Density = "comfortable" | "compact";

export type Prefs = {
  dailyGoalHours: number;
  targetAtar: number;
  reminderDays: number[];
  accent: AccentKey;
  density: Density;
};

export const DEFAULT_PREFS: Prefs = {
  dailyGoalHours: 2,
  targetAtar: 97,
  reminderDays: [7, 3, 1],
  accent: "purple",
  density: "comfortable",
};

export const ACCENTS: Record<AccentKey, { label: string; primary: string; swatch: string }> = {
  purple: { label: "Summit Purple", primary: "oklch(0.68 0.22 300)", swatch: "oklch(0.68 0.22 300)" },
  gold: { label: "Gold Lean", primary: "oklch(0.74 0.17 320)", swatch: "oklch(0.86 0.11 82)" },
  violet: { label: "Cool Violet", primary: "oklch(0.62 0.2 278)", swatch: "oklch(0.62 0.2 278)" },
};

const PREFS_KEY = "summit-prefs-v1";

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

function load(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function getPrefs(): Prefs {
  if (cache === null) cache = load();
  return cache;
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...getPrefs(), ...patch };
  cache = next;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  applyPrefs(next);
  listeners.forEach((l) => l());
}

/** Paints accent + density onto the document root. */
export function applyPrefs(p: Prefs = getPrefs()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", ACCENTS[p.accent]?.primary ?? ACCENTS.purple.primary);
  root.classList.toggle("density-compact", p.density === "compact");
}

export function usePrefs() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    applyPrefs();
    return () => {
      listeners.delete(l);
    };
  }, []);
  const update = useCallback((patch: Partial<Prefs>) => setPrefs(patch), []);
  return { prefs: getPrefs(), update };
}
