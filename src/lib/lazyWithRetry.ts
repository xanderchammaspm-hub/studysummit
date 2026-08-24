import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "summit-chunk-reload-at";

/**
 * lazy() that survives stale build hashes.
 *
 * After a new deploy, an open tab still references the previous chunk URLs, so
 * the dynamic import 404s ("Failed to fetch dynamically imported module") and
 * the page goes blank. Retry once, then force a single hard reload to pick up
 * the fresh asset manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      try {
        return await factory();
      } catch {
        if (typeof window !== "undefined") {
          const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
          if (Date.now() - last > 10_000) {
            sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
            window.location.reload();
            // Keep Suspense pending while the reload happens.
            return await new Promise<{ default: T }>(() => {});
          }
        }
        throw error;
      }
    }
  });
}
