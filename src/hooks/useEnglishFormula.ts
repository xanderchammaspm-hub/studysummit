import { useCallback, useEffect, useState } from "react";
import type { DocSection, SkeletonPart } from "@/data/englishFormula";

const KEY = "summit-english-formula-store-v1";

export type PartOverride = Partial<Pick<SkeletonPart, "title" | "sub" | "hint">>;

export type FormulaStore = {
  /** modeId -> partId -> override */
  parts: Record<string, Record<string, PartOverride>>;
  /** modeId -> extra sidebar sections */
  sections: Record<string, DocSection[]>;
  /** modeId -> ordered list of section ids (built-in + custom) */
  order?: Record<string, string[]>;
};

const EMPTY: FormulaStore = { parts: {}, sections: {}, order: {} };

function read(): FormulaStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as FormulaStore) };
  } catch {
    return EMPTY;
  }
}

export function useEnglishFormula() {
  const [store, setStore] = useState<FormulaStore>(EMPTY);

  useEffect(() => {
    setStore(read());
  }, []);

  const commit = useCallback((next: FormulaStore) => {
    setStore(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }, []);

  const updatePart = useCallback(
    (modeId: string, partId: string, patch: PartOverride) => {
      setStore((prev) => {
        const next: FormulaStore = {
          ...prev,
          parts: {
            ...prev.parts,
            [modeId]: {
              ...(prev.parts[modeId] ?? {}),
              [partId]: { ...(prev.parts[modeId]?.[partId] ?? {}), ...patch },
            },
          },
        };
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [],
  );

  const addSection = useCallback(
    (modeId: string, label: string) => {
      const id = `custom-${Date.now().toString(36)}`;
      const list = [...(store.sections[modeId] ?? []), { id, label, blurb: "" }];
      commit({ ...store, sections: { ...store.sections, [modeId]: list } });
      return id;
    },
    [store, commit],
  );

  const renameSection = useCallback(
    (modeId: string, id: string, label: string) => {
      const list = (store.sections[modeId] ?? []).map((s) =>
        s.id === id ? { ...s, label } : s,
      );
      commit({ ...store, sections: { ...store.sections, [modeId]: list } });
    },
    [store, commit],
  );

  const removeSection = useCallback(
    (modeId: string, id: string) => {
      const list = (store.sections[modeId] ?? []).filter((s) => s.id !== id);
      commit({ ...store, sections: { ...store.sections, [modeId]: list } });
    },
    [store, commit],
  );

  const setOrder = useCallback(
    (modeId: string, ids: string[]) => {
      commit({ ...store, order: { ...(store.order ?? {}), [modeId]: ids } });
    },
    [store, commit],
  );

  const moveSection = useCallback(
    (modeId: string, ids: string[], from: number, to: number) => {
      if (to < 0 || to >= ids.length || from === to) return;
      const next = [...ids];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      setOrder(modeId, next);
    },
    [setOrder],
  );

  return { store, updatePart, addSection, renameSection, removeSection, setOrder, moveSection };
}
