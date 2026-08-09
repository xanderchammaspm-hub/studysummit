import { useCallback, useEffect, useState } from "react";

export type AccentKey = "purple" | "gold" | "violet";
export type Density = "comfortable" | "compact";

export type Prefs = {
  dailyGoalHours: number;
  targetAtar: number;
  reminderDays: number[];
  accent: AccentKey;
  density: Density;
  /** Galaxy background brightness, 0–100. */
  bgIntensity: number;
  /** Galaxy background motion speed, 0 (still) – 200 (lively). 100 = default. */
  bgSpeed: number;
};

export const DEFAULT_PREFS: Prefs = {
  dailyGoalHours: 2,
  targetAtar: 97,
  reminderDays: [7, 3, 1],
  accent: "purple",
  density: "comfortable",
  bgIntensity: 70,
  bgSpeed: 100,
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
    const parsed = raw ? ({ ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } as Prefs) : DEFAULT_PREFS;
    // one-time bump of the old default target ATAR (95 -> 97)
    if (raw && parsed.targetAtar === 95 && !localStorage.getItem("summit-prefs-atar97")) {
      parsed.targetAtar = 97;
      localStorage.setItem("summit-prefs-atar97", "1");
      localStorage.setItem(PREFS_KEY, JSON.stringify(parsed));
    }
    return parsed;
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

/** Paints accent, density and galaxy background prefs onto the document root. */
export function applyPrefs(p: Prefs = getPrefs()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", ACCENTS[p.accent]?.primary ?? ACCENTS.purple.primary);
  root.classList.toggle("density-compact", p.density === "compact");

  const intensity = Math.min(100, Math.max(0, p.bgIntensity ?? 70));
  const speed = Math.min(200, Math.max(0, p.bgSpeed ?? 100));
  root.style.setProperty("--nebula-opacity", String(intensity / 70));
  // 0 speed = frozen; otherwise scale animation durations inversely.
  root.style.setProperty("--nebula-speed", String(speed === 0 ? 0 : speed / 100));
  root.classList.toggle("bg-still", speed === 0);
  root.classList.toggle("bg-off", intensity === 0);
}

export function usePrefs() {
  const [, tick] = useState(0);
  // Server render (and the first client render) must agree, so stored prefs are
  // only applied after hydration.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    applyPrefs();
    setHydrated(true);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const update = useCallback((patch: Partial<Prefs>) => setPrefs(patch), []);
  return { prefs: hydrated ? getPrefs() : DEFAULT_PREFS, update };
}
