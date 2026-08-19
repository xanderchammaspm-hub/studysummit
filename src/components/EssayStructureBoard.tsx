import { useCallback, useEffect, useState } from "react";
import { ListOrdered, Plus, Trash2 } from "lucide-react";

const PREFIX = "summit-english-structure-v1:";

export type StructureStep = { id: string; title: string; detail: string };

function load(modeId: string): StructureStep[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + modeId);
    const parsed = raw ? (JSON.parse(raw) as StructureStep[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * Quick-read numbered structure of a piece of writing — the skeleton without
 * the skeleton. Each writing mode keeps its own separate list.
 */
export function EssayStructureBoard({
  modeId,
  modeLabel,
}: {
  modeId: string;
  modeLabel: string;
}) {
  const [steps, setSteps] = useState<StructureStep[]>([]);

  // Reload whenever the workspace changes so lists never bleed across modes.
  useEffect(() => {
    setSteps(load(modeId));
    const onRemote = () => setSteps(load(modeId));
    window.addEventListener("summit-remote-sync", onRemote);
    return () => window.removeEventListener("summit-remote-sync", onRemote);
  }, [modeId]);

  const commit = useCallback(
    (next: StructureStep[]) => {
      setSteps(next);
      try {
        localStorage.setItem(PREFIX + modeId, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
    },
    [modeId],
  );

  const add = () => commit([...steps, { id: uid(), title: "", detail: "" }]);
  const patch = (id: string, p: Partial<StructureStep>) =>
    commit(steps.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const remove = (id: string) => commit(steps.filter((s) => s.id !== id));

  return (
    <section className="ef-structure relative mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-card/50 p-4 backdrop-blur-xl transition-colors duration-300 hover:border-primary/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px shimmer-line" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--color-primary) 14%, transparent) 0%, transparent 60%)",
        }}
      />

      <header className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
          <ListOrdered className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold tracking-tight text-foreground">
            Structure — {modeLabel}
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Numbered, skeleton-free. Only for this workspace.
          </p>
        </div>
      </header>

      <ol className="relative mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className="group/step relative rounded-xl border border-border/60 bg-surface/50 p-2.5 transition-all duration-300 hover:border-primary/50 hover:bg-surface/70"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/15 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <input
                  value={s.title}
                  onChange={(e) => patch(s.id, { title: e.target.value })}
                  placeholder="Component (e.g. Thesis)"
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
                />
                <textarea
                  value={s.detail}
                  onChange={(e) => patch(s.id, { detail: e.target.value })}
                  rows={2}
                  placeholder="What goes here…"
                  className="mt-1 w-full resize-y bg-transparent text-xs leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <button
                onClick={() => remove(s.id)}
                aria-label="Remove step"
                className="cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/step:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}

        {steps.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground md:col-span-2 xl:col-span-3">
            Nothing yet — add your first step.
          </li>
        )}
      </ol>

      <button
        onClick={add}
        className="relative mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add step
      </button>
    </section>
  );
}

export default EssayStructureBoard;
