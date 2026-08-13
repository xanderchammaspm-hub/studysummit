import { useCallback, useEffect, useState } from "react";
import type {
  Highlight,
  PaperAnnotations,
  PaperNote,
} from "@/components/exam/types";

const EMPTY: PaperAnnotations = { highlights: [], notes: [] };

const keyFor = (paperId: string) => `summit-annotations:${paperId}`;

function read(paperId: string): PaperAnnotations {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(keyFor(paperId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PaperAnnotations>;
    return {
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch {
    return EMPTY;
  }
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Per-paper highlights and notes. Persisted under the `summit-` prefix so the
 * existing cloud autosave mirrors them to the signed-in account for free.
 */
export function usePaperAnnotations(paperId: string) {
  const [data, setData] = useState<PaperAnnotations>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(read(paperId));
    setHydrated(true);
  }, [paperId]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(keyFor(paperId), JSON.stringify(data));
    } catch {
      /* storage full or unavailable — annotations stay in memory */
    }
  }, [data, hydrated, paperId]);

  const addHighlight = useCallback((h: Omit<Highlight, "id" | "createdAt">) => {
    setData((prev) => ({
      ...prev,
      highlights: [...prev.highlights, { ...h, id: newId(), createdAt: Date.now() }],
    }));
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h.id !== id),
    }));
  }, []);

  const addNote = useCallback((n: Omit<PaperNote, "id" | "createdAt">) => {
    const id = newId();
    setData((prev) => ({
      ...prev,
      notes: [...prev.notes, { ...n, id, createdAt: Date.now() }],
    }));
    return id;
  }, []);

  const updateNote = useCallback((id: string, body: string) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, body } : n)),
    }));
  }, []);

  const removeNote = useCallback((id: string) => {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
  }, []);

  return {
    ...data,
    hydrated,
    count: data.highlights.length + data.notes.length,
    addHighlight,
    removeHighlight,
    addNote,
    updateNote,
    removeNote,
  };
}
