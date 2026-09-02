import { Brain, CheckCircle2, Sparkles, TriangleAlert, Zap } from "lucide-react";
import type { RecallSession } from "@/components/recall/types";
import { GlassModal, ModeChip, ScoreRing, scoreColor } from "@/components/recall/RecallShared";
import { cn } from "@/lib/utils";

function Chips({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" | "bad" }) {
  if (!items?.length) return null;
  const chip =
    tone === "good"
      ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-200"
      : tone === "warn"
        ? "border-yellow/40 bg-yellow/10 text-yellow"
        : "border-red-400/40 bg-red-500/12 text-red-200";
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((c) => (
          <span key={c} className={cn("rounded-full border px-2.5 py-1 text-[11px]", chip)}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Read-back of a finished session — blurt text + stats, or the graded recall run. */
export function SessionDetail({ session, onClose }: { session: RecallSession; onClose: () => void }) {
  const p = session.payload;
  const when = new Date(session.created_at).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <GlassModal
      title={
        <span className="flex items-center gap-2">
          <ModeChip mode={session.mode} />
          <span className={cn("tabular-nums", scoreColor(session.score))}>{session.score}%</span>
        </span>
      }
      subtitle={`${when}${p?.materials?.length ? ` · ${p.materials.join(", ")}` : ""}`}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      {p && p.kind === "blurt" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl purple-outline bg-surface/40 px-5 py-5">
            <ScoreRing value={p.analysis.coverage} label="Coverage" size={124} />
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[
                { label: "Words", value: p.blurt.trim() ? p.blurt.trim().split(/\s+/).length : 0, icon: <Brain className="h-3.5 w-3.5 text-primary" /> },
                { label: "Remembered", value: p.analysis.remembered.length, icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> },
                { label: "Missing", value: p.analysis.missing.length, icon: <Sparkles className="h-3.5 w-3.5 text-yellow" /> },
                { label: "To correct", value: p.analysis.incorrect.length, icon: <TriangleAlert className="h-3.5 w-3.5 text-red-300" /> },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/50 bg-card/50 px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.icon}
                    {s.label}
                  </div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {p.analysis.summary ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{p.analysis.summary}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Chips title="Remembered" items={p.analysis.remembered} tone="good" />
            <Chips title="Missing" items={p.analysis.missing} tone="warn" />
            <Chips title="Needs correcting" items={p.analysis.incorrect} tone="bad" />
            <Chips title="Strongest areas" items={p.analysis.strongest} tone="good" />
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              What you wrote
            </div>
            <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-border/50 bg-surface/40 px-4 py-3.5 text-sm leading-relaxed">
              {p.blurt}
            </div>
          </div>
        </div>
      ) : p && p.kind === "quick_recall" ? (
        <div className="space-y-4">
          {p.summary?.summary ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{p.summary.summary}</p>
          ) : null}
          <ol className="space-y-2.5">
            {p.questions.map((q, i) => {
              const g = p.grades[i];
              return (
                <li key={q.n ?? i} className="rounded-2xl border border-border/50 bg-surface/40 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium">
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {q.question}
                    </div>
                    {g ? (
                      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", scoreColor(g.score))}>
                        {g.score}%
                      </span>
                    ) : null}
                  </div>
                  {g?.feedback ? <p className="mt-1.5 text-xs text-muted-foreground">{g.feedback}</p> : null}
                </li>
              );
            })}
          </ol>
          <div className="grid gap-4 sm:grid-cols-2">
            <Chips title="Strengths" items={p.summary?.strengths ?? []} tone="good" />
            <Chips title="Review next" items={p.summary?.review ?? []} tone="warn" />
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" /> No detail stored for this session.
        </p>
      )}
    </GlassModal>
  );
}
