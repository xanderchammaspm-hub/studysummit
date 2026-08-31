import { useMemo } from "react";
import { Brain, Flame, Layers, Target, TrendingUp, Zap } from "lucide-react";
import type { RecallSession, RecallSubject } from "@/components/recall/types";
import type { OverallStats, SubjectStats } from "@/hooks/useRecallStore";
import { ScoreRing, StatTile, relativeDay, scoreColor } from "@/components/recall/RecallShared";
import { cn } from "@/lib/utils";

type Props = {
  subjects: RecallSubject[];
  sessions: RecallSession[];
  overall: OverallStats;
  statsFor: (subjectId: string) => SubjectStats;
  onOpenSubject?: (subjectId: string) => void;
  onOpenFolder?: (subjectId: string, folderId: string) => void;
};

/* ------------------------------ Sparkline ------------------------------- */

function Sparkline({ scores }: { scores: number[] }) {
  const w = 640;
  const h = 120;
  if (scores.length < 2) {
    return (
      <div className="grid h-[120px] place-items-center text-xs text-muted-foreground">
        Complete a couple of sessions to see your trend.
      </div>
    );
  }
  const step = w / (scores.length - 1);
  const pt = (v: number, i: number) => [i * step, h - (Math.max(0, Math.min(100, v)) / 100) * (h - 12) - 6] as const;
  const line = scores.map((v, i) => pt(v, i).join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[120px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="recallFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="recallStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--yellow)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#recallFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="url(#recallStroke)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
      />
      {scores.map((v, i) => {
        const [x, y] = pt(v, i);
        return <circle key={`${i}-${v}`} cx={x} cy={y} r={2.5} fill="var(--yellow)" />;
      })}
    </svg>
  );
}

function SplitBar({ recall, blurt }: { recall: number | null; blurt: number | null }) {
  return (
    <div className="space-y-2.5">
      {[
        { label: "Quick Recall", value: recall, cls: "bg-yellow", icon: <Zap className="h-3 w-3 text-yellow" /> },
        { label: "Blurt", value: blurt, cls: "bg-primary", icon: <Brain className="h-3 w-3 text-primary" /> },
      ].map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {row.icon}
              {row.label}
            </span>
            <span className="tabular-nums">{row.value == null ? "—" : `${row.value}%`}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface/70">
            <div
              className={cn("h-full rounded-full transition-[width] duration-700 ease-out", row.cls)}
              style={{ width: `${row.value ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecallAnalytics({ subjects, sessions, overall, statsFor, onOpenSubject, onOpenFolder }: Props) {
  const trend = useMemo(() => sessions.slice(0, 14).map((s) => s.score).reverse(), [sessions]);
  const recallAvg = useMemo(() => {
    const xs = sessions.filter((s) => s.mode === "quick_recall").map((s) => s.score);
    return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  }, [sessions]);
  const blurtAvg = useMemo(() => {
    const xs = sessions.filter((s) => s.mode === "blurt").map((s) => s.score);
    return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  }, [sessions]);

  return (
    <div className="space-y-6 fade-in-up">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl purple-outline bg-card/60 px-4 py-6 backdrop-blur-xl sm:px-8 sm:py-7">
          <ScoreRing value={overall.avgScore ?? 0} label="Overall mastery" size={128} />
          {overall.delta != null ? (
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold",
                overall.delta >= 0
                  ? "border-emerald-400/50 bg-emerald-500/12 text-emerald-300"
                  : "border-red-400/50 bg-red-500/12 text-red-300",
              )}
            >
              <TrendingUp className={cn("h-3 w-3", overall.delta < 0 && "rotate-180")} />
              {overall.delta > 0 ? `+${overall.delta}` : overall.delta} pts recently
            </span>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            <StatTile icon={<Flame className="h-3.5 w-3.5 text-yellow" />} label="Sessions" value={overall.sessions} />
            <StatTile icon={<Layers className="h-3.5 w-3.5 text-primary" />} label="Materials" value={overall.materials} />
            <StatTile
              icon={<Target className="h-3.5 w-3.5 text-primary" />}
              label="Subjects"
              value={overall.subjects}
              hint={`${overall.folders} folders`}
            />
            <StatTile
              icon={<Zap className="h-3.5 w-3.5 text-yellow" />}
              label="Recall vs Blurt"
              value={
                <span className="text-base">
                  {recallAvg == null ? "—" : `${recallAvg}%`}{" "}
                  <span className="text-muted-foreground">/</span>{" "}
                  {blurtAvg == null ? "—" : `${blurtAvg}%`}
                </span>
              }
            />
          </div>
          <div className="rounded-3xl purple-outline bg-card/60 px-5 py-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Score trend
              </span>
              <span className="text-[10px] text-muted-foreground">last {trend.length} sessions</span>
            </div>
            <Sparkline scores={trend} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl purple-outline bg-card/60 px-5 py-4 backdrop-blur-xl">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recall vs Blurt — overall
        </div>
        <div className="mt-3">
          <SplitBar recall={recallAvg} blurt={blurtAvg} />
        </div>
      </div>

      {overall.needsReview.length ? (
        <div className="rounded-3xl border border-yellow/30 bg-yellow/6 px-5 py-4 backdrop-blur-xl">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow">Weakest concepts overall</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {overall.needsReview.map((c) => (
              <span key={c} className="rounded-full border border-yellow/35 bg-yellow/10 px-2.5 py-1 text-[11px] text-yellow">
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">By subject</h3>
        {subjects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-surface/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Add a subject to start tracking mastery.
          </p>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {subjects.map((s) => {
              const st = statsFor(s.id);
              return (
                <div
                  key={s.id}
                  role={onOpenSubject ? "button" : undefined}
                  tabIndex={onOpenSubject ? 0 : undefined}
                  onClick={onOpenSubject ? () => onOpenSubject(s.id) : undefined}
                  onKeyDown={
                    onOpenSubject
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onOpenSubject(s.id);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "group rounded-3xl purple-outline bg-card/60 p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/60",
                    onOpenSubject && "cursor-pointer",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.emoji}</span>
                        <span className="truncate text-base font-semibold tracking-tight">{s.name}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {st.folders} folders · {st.materials} materials · {st.attempts} sessions
                      </div>
                    </div>
                    <div className={cn("text-2xl font-semibold tabular-nums", scoreColor(st.mastery ?? 0))}>
                      {st.mastery == null ? "—" : `${st.mastery}%`}
                    </div>
                  </div>

                  <div className="mt-4">
                    <SplitBar recall={st.recallAvg} blurt={st.blurtAvg} />
                  </div>

                  {st.needsReview.length ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {st.needsReview.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-border/60 bg-surface/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {st.recent.length ? (
                    <ul className="mt-4 space-y-1.5 border-t border-border/50 pt-3">
                      {st.recent.map((r) => (
                        <li
                          key={r.id}
                          onClick={
                            onOpenFolder && r.folderId
                              ? (e) => {
                                  e.stopPropagation();
                                  onOpenFolder(s.id, r.folderId!);
                                }
                              : undefined
                          }
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-[11px]",
                            onOpenFolder && r.folderId && "cursor-pointer hover:bg-primary/10",
                          )}
                        >
                          <span className="truncate text-muted-foreground">
                            {r.mode === "quick_recall" ? "⚡" : "🧠"} {r.folderName}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground/70">{relativeDay(r.created_at)}</span>
                            <span className={cn("font-semibold tabular-nums", scoreColor(r.score))}>{r.score}%</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
