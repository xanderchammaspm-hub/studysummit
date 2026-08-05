import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PARTS,
  DEFAULT_SECTIONS,
  type DocSection,
  type SkeletonPart,
} from "@/data/englishFormula";

const KEY = "summit-english-formula-v2:config";

type Config = { parts: SkeletonPart[]; sections: DocSection[] };

const DEFAULTS: Config = { parts: DEFAULT_PARTS, sections: DEFAULT_SECTIONS };

/** Editable blueprint + sidebar config, persisted locally. */
export function useEnglishFormula() {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Config>;
        setConfig({
          parts: parsed.parts?.length ? parsed.parts : DEFAULT_PARTS,
          sections: parsed.sections?.length ? parsed.sections : DEFAULT_SECTIONS,
        });
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const commit = useCallback((next: Config) => {
    setConfig(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const updatePart = useCallback(
    (id: string, patch: Partial<SkeletonPart>) =>
      setConfig((c) => {
        const next = { ...c, parts: c.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }),
    [],
  );

  const addSection = useCallback(
    (label: string) => {
      const id = `custom-${Date.now().toString(36)}`;
      commit({
        ...config,
        sections: [...config.sections, { id, label, blurb: "Your own tool — write anything here." }],
      });
      return id;
    },
    [commit, config],
  );

  const renameSection = useCallback(
    (id: string, label: string) =>
      commit({
        ...config,
        sections: config.sections.map((s) => (s.id === id ? { ...s, label } : s)),
      }),
    [commit, config],
  );

  const removeSection = useCallback(
    (id: string) => commit({ ...config, sections: config.sections.filter((s) => s.id !== id) }),
    [commit, config],
  );

  const reset = useCallback(() => commit(DEFAULTS), [commit]);

  return {
    parts: config.parts,
    sections: config.sections,
    hydrated,
    updatePart,
    addSection,
    renameSection,
    removeSection,
    reset,
  };
}
