/**
 * One-time local progress reset (study hours / streak caches).
 * Runs once per browser, then never again.
 */
const FLAG = "summit-progress-reset-v2";

const KEYS = ["summit-study-logs-v1", "summit-streak-v1", "summit-xp-cache-v1"];

export function runProgressResetOnce() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(FLAG)) return;
    for (const k of KEYS) localStorage.removeItem(k);
    localStorage.setItem(FLAG, "1");
  } catch {
    /* ignore */
  }
}
