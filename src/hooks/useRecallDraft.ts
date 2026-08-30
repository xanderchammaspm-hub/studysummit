import { useEffect, useRef, useState } from "react";

/**
 * Autosave + recovery for in-progress Quick Recall / Blurt attempts.
 * Drafts are stored per folder so a refresh never loses written work.
 */

const PREFIX = "summit-recall-draft:";

function key(tool: string, folderId: string) {
  return `${PREFIX}${tool}:${folderId}`;
}

export function readDraft<T>(tool: string, folderId: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(tool, folderId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; data: T };
    // Drafts older than 3 days are stale.
    if (!parsed || Date.now() - parsed.savedAt > 3 * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(key(tool, folderId));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function clearDraft(tool: string, folderId: string) {
  try {
    window.localStorage.removeItem(key(tool, folderId));
  } catch {
    /* storage unavailable */
  }
}

/** Debounced autosave of any serialisable draft state. Pass `null` to clear. */
export function useAutosaveDraft<T>(tool: string, folderId: string, data: T | null, enabled: boolean) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        if (data == null) {
          window.localStorage.removeItem(key(tool, folderId));
          return;
        }
        window.localStorage.setItem(
          key(tool, folderId),
          JSON.stringify({ savedAt: Date.now(), data }),
        );
        setSavedAt(Date.now());
      } catch {
        /* quota or storage unavailable — ignore */
      }
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [tool, folderId, data, enabled]);

  return savedAt;
}
