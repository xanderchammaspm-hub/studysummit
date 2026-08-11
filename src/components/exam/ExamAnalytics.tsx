import { useMemo } from "react";
import type { Attempt, AnswerRow } from "./types";
import { pct } from "./types";
import { Activity, BarChart3, Target, TrendingUp } from "lucide-react";

export function ExamAnalytics({
  attempts,
  answers,
}: {
  attempts: Attempt[];
  answers: AnswerRow[];
}) {
  const completed = attempts.filter((a) => a.completed_at);
  const totalAwarded = answers.reduce((s, a) => s + Number(a.awarded), 0);
  const totalPossible = answers.reduce((s, a) => s + Number(a.max_marks), 0);
  const overall = pct(totalAwarded, totalPossible);

  const topics = useMemo(() => {
    const map = new Map<string, { awarded: number; max: number; count: number }>();
    for (const a of answers) {
      const key = a.topic || a.subject || "General";
      const cur = map.get(key) ?? { awarded: 0, max: 0, count: 0 };
      cur.awarded += Number(a.awarded);
      cur.max += Number(a.max_marks);
      cur.count += 1;
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([topic, v]) => ({ topic, mastery: pct(v.awarded, v.max), count: v.count }))
      .sort((a, b) => a.mastery - b.mastery);
  }, [answers]);

  const bySubject = useMemo(() => {
    const map = new Map<
      string,
      { awarded: number; max: number; count: number; topics: Map<string, { a: number; m: number; c: number }> }
    >();
    for (const a of answers) {
      const key = a.subject || "General";
      const cur =
        map.get(key) ?? { awarded: 0, max: 0, count: 0, topics: new Map<string, { a: number; m: number; c: number }>() };
      cur.awarded += Number(a.awarded);
      cur.max += Number(a.max_marks);
      cur.count += 1;
      const tk = a.topic || "General";
      const t = cur.topics.get(tk) ?? { a: 0, m: 0, c: 0 };
      t.a += Number(a.awarded);
      t.m += Number(a.max_marks);
      t.c += 1;
      cur.topics.set(tk, t);
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([subject, v]) => ({
        subject,
        mastery: pct(v.awarded, v.max),
        count: v.count,
        papers: completed.filter((c) => c.subject === subject).length,
        topics: [...v.topics.entries()]
          .map(([topic, t]) => ({ topic, mastery: pct(t.a, t.m), count: t.c }))
          .sort((x, y) => x.mastery - y.mastery),
      }))
      .sort((a, b) => a.mastery - b.mastery);
  }, [answers, completed]);

  const trend = useMemo(
    () =>
      completed
        .slice()
        .sort((a, b) => +new Date(a.started_at) - +new Date(b.started_at))
        .map((a) => pct(Number(a.awarded_marks), Number(a.total_marks))),
    [completed],
  );

  if (answers.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-10 text-center">
        <BarChart3 className="mx-auto mb-3 h-7 w-7 text-primary" />
        <h3 className="text-base font-semibold tracking-tight">No data yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sit a paper and your topic mastery will build here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Target className="h-4 w-4 text-primary" />} label="Overall mastery" value={`${overall}%`} />
        <Metric icon={<Activity className="h-4 w-4 text-yellow" />} label="Papers completed" value={String(completed.length)} />
        <Metric icon={<BarChart3 className="h-4 w-4 text-primary" />} label="Questions marked" value={String(answers.length)} />
        <Metric
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          label="Marks earned"
          value={`${Math.round(totalAwarded)}/${Math.round(totalPossible)}`}
        />
      </div>

      {/* Trend */}
      {trend.length > 1 && (
        <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md">
          <h3 className="mb-5 text-sm font-semibold tracking-tight">Score trend</h3>
          <div className="flex h-36 items-end gap-2">
            {trend.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${Math.max(6, v)}%`,
                    background: "linear-gradient(180deg, oklch(0.86 0.11 82 / 0.85), oklch(0.68 0.22 300))",
                  }}
                  title={`${v}%`}
                />
                <span className="text-[10px] tabular-nums text-muted-foreground">{v}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Topic mastery */}
      <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md">
        <h3 className="mb-1 text-sm font-semibold tracking-tight">Topic mastery</h3>
        <p className="mb-5 text-xs text-muted-foreground">Weakest topics first — your revision order.</p>
        <div className="space-y-4">
          {topics.map((t, i) => (
            <div key={t.topic}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm">{t.topic}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t.mastery}% · {t.count} {t.count === 1 ? "question" : "questions"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="bar-fill-anim h-full rounded-full"
                  style={{
                    width: `${t.mastery}%`,
                    animationDelay: `${i * 60}ms`,
                    background:
                      t.mastery >= 80
                        ? "linear-gradient(90deg, oklch(0.7 0.17 150), oklch(0.8 0.16 145))"
                        : t.mastery >= 50
                          ? "linear-gradient(90deg, oklch(0.75 0.13 82), oklch(0.88 0.12 82))"
                          : "linear-gradient(90deg, oklch(0.6 0.2 20), oklch(0.7 0.22 25))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent attempts */}
      <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-md">
        <h3 className="mb-4 text-sm font-semibold tracking-tight">Recent attempts</h3>
        <div className="space-y-2">
          {attempts.slice(0, 8).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/40 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{a.paper_title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.subject} · {new Date(a.started_at).toLocaleDateString()}
                  {!a.completed_at && " · in progress"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums gradient-text">
                {pct(Number(a.awarded_marks), Number(a.total_marks))}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="fade-in-up rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-md purple-glow-hover">
      <div className="mb-3 w-fit rounded-lg border border-border bg-surface/70 p-2">{icon}</div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

export default ExamAnalytics;
