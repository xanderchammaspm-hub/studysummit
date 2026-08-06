import { useMemo } from "react";
import { Flame, PenLine, Target, TrendingDown } from "lucide-react";
import { useSubjects, useAllSubjectStates, flattenSubject, type YearKey } from "@/hooks/useSubjectStore";
import { usePrefs } from "@/hooks/usePrefs";
import { RichEditor } from "@/components/RichEditor";

const YEARS: YearKey[] = ["Year 11", "Year 12"];

export function DailyPlan() {
  const subjects = useSubjects();
  const store = useAllSubjectStates();
  const { prefs } = usePrefs();

  const weakest = useMemo(() => {
    const weak: { subject: string; title: string; status: string }[] = [];
    for (const y of YEARS) {
      for (const [i, s] of subjects[y].entries()) {
        const label = s.name.trim() || `Subject ${i + 1}`;
        const flat = flattenSubject(store[s.id]);
        for (const t of flat.topics) {
          if (t.status === "red" || t.status === "amber") {
            weak.push({ subject: label, title: t.title, status: t.status });
          }
        }
      }
    }
    weak.sort((a, b) => (a.status === "red" ? -1 : 1) - (b.status === "red" ? -1 : 1));
    return weak.slice(0, 5);
  }, [subjects, store]);

  const focus = weakest[0]
    ? `Rebuild ${weakest[0].title} (${weakest[0].subject}) — write a one-page summary, then do 3 practice questions.`
    : "Add topics to your traffic light system so Summit can pick your next task.";

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="relative overflow-hidden glass-panel p-6 fade-in-up">
        <div className="absolute inset-x-0 top-0 h-px shimmer-line" />

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Today's plan
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-lg font-medium leading-snug">{focus}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-yellow" />
            Goal · {prefs.dailyGoalHours}h today · target ATAR {prefs.targetAtar}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-border/60 bg-surface/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="text-primary">
                <PenLine className="h-3.5 w-3.5" />
              </span>
              Goals for today
            </div>
            <RichEditor
              storageKey="daily-goals"
              placeholder="Write today's goals — bold, underline, lists, tables…"
              minHeight={180}
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="text-primary">
                <TrendingDown className="h-3.5 w-3.5" />
              </span>
              Weakest topics
            </div>
            <div className="space-y-2">
              {weakest.length === 0 ? (
                <p className="px-1 text-xs italic text-muted-foreground">
                  No red or yellow topics — nice work.
                </p>
              ) : (
                weakest.map((w) => (
                  <div
                    key={`${w.subject}-${w.title}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm">{w.title}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{w.subject}</div>
                    </div>
                    <div className="shrink-0 text-xs tabular-nums">
                      <span className={w.status === "red" ? "text-destructive" : "text-yellow"}>
                        {w.status === "amber" ? "yellow" : w.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
