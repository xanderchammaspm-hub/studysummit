import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { gradeAnswer } from "@/lib/exam.functions";
import type { AnswerRow } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Sparkles } from "lucide-react";

export function MistakeVault({
  mistakes,
  onRefresh,
}: {
  mistakes: AnswerRow[];
  onRefresh: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [retry, setRetry] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<Record<string, { awarded: number; feedback: string }>>({});

  const grouped = useMemo(() => {
    const map = new Map<string, AnswerRow[]>();
    for (const m of mistakes) {
      const key = m.subject ?? "General";
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    return [...map.entries()];
  }, [mistakes]);

  async function markResolved(row: AnswerRow) {
    const { error } = await supabase
      .from("attempt_answers")
      .update({ resolved: true })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Nice — cleared from your vault");
    onRefresh();
  }

  async function retryAnswer(row: AnswerRow) {
    const answer = (retry[row.id] ?? "").trim();
    if (answer.length < 5) return toast.error("Write your new attempt first");
    setBusyId(row.id);
    try {
      const res = await gradeAnswer({
        data: {
          prompt: row.question_prompt,
          answer,
          marks: Math.max(1, Math.round(row.max_marks)),
          exemplar: row.exemplar ?? undefined,
          subject: row.subject ?? undefined,
          topic: row.topic ?? undefined,
        },
      });
      setRetryResult((r) => ({ ...r, [row.id]: { awarded: res.awarded, feedback: res.feedback } }));
      if (res.awarded >= row.max_marks * 0.8) {
        await supabase.from("attempt_answers").update({ resolved: true }).eq("id", row.id);
        toast.success(`${res.awarded}/${row.max_marks} — mastered, cleared from the vault!`);
        onRefresh();
      } else {
        toast.message(`${res.awarded}/${row.max_marks} — keep practising this one.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Marking failed");
    } finally {
      setBusyId(null);
    }
  }

  if (mistakes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-10 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-7 w-7 text-emerald-400" />
        <h3 className="text-base font-semibold tracking-tight">Vault is empty</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Low-scoring questions land here automatically for spaced repetition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([subject, rows]) => (
        <section key={subject} className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow" />
            <h3 className="text-sm font-semibold tracking-tight">{subject}</h3>
            <span className="text-xs text-muted-foreground">{rows.length} to revisit</span>
          </div>

          <div className="space-y-3">
            {rows.map((row, i) => {
              const open = openId === row.id;
              const res = retryResult[row.id];
              return (
                <article
                  key={row.id}
                  className="fade-in-up overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md purple-glow-hover"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <button
                    onClick={() => setOpenId(open ? null : row.id)}
                    className="flex w-full items-start gap-4 p-5 text-left"
                  >
                    <span className="mt-0.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] tabular-nums text-destructive">
                      {row.awarded}/{row.max_marks}
                    </span>
                    <span className="flex-1">
                      <span className="line-clamp-2 block text-sm leading-snug">{row.question_prompt}</span>
                      {row.topic && (
                        <span className="mt-1 block text-[11px] text-primary">{row.topic}</span>
                      )}
                    </span>
                    <RotateCcw
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180 text-primary" : ""}`}
                    />
                  </button>

                  {open && (
                    <div className="space-y-4 border-t border-border p-5">
                      {row.feedback && (
                        <p className="text-sm leading-relaxed text-muted-foreground">{row.feedback}</p>
                      )}
                      {row.missing_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.missing_keywords.map((k) => (
                            <span
                              key={k}
                              className="rounded-full border border-yellow/40 bg-yellow/10 px-2.5 py-1 text-[11px] text-yellow"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      )}

                      <div>
                        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                          Try again
                        </p>
                        <Textarea
                          value={retry[row.id] ?? ""}
                          onChange={(e) => setRetry((r) => ({ ...r, [row.id]: e.target.value }))}
                          placeholder="Rewrite your response using the feedback above…"
                          className="min-h-[120px] bg-surface/50 text-sm"
                        />
                      </div>

                      {res && (
                        <div className="rounded-xl border border-border bg-surface/50 p-4">
                          <p className="text-sm font-semibold tabular-nums">
                            {res.awarded}/{row.max_marks} this time
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{res.feedback}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => retryAnswer(row)}
                          disabled={busyId === row.id}
                          className="gap-2"
                        >
                          {busyId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          Re-mark
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markResolved(row)}
                          className="gap-2 border-border bg-surface/60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark as mastered
                        </Button>
                      </div>

                      {row.exemplar && (
                        <details className="rounded-lg border border-border bg-card/60 p-3">
                          <summary className="cursor-pointer text-xs font-medium text-primary">
                            Show exemplar response
                          </summary>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                            {row.exemplar}
                          </p>
                        </details>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default MistakeVault;
